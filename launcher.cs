using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace ScadaSubstationLauncher
{
    static class Program
    {
        private static Process serverProcess = null;
        private static Process appWindowProcess = null;
        private static NotifyIcon trayIcon = null;
        private static System.Windows.Forms.Timer processMonitorTimer = null;
        private static int serverPort = 3000;
        private static string serverUrl = "http://localhost:3000";
        private static string appDir = "";
        private static bool isExiting = false;

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            appDir = AppDomain.CurrentDomain.BaseDirectory;
            Directory.SetCurrentDirectory(appDir);

            // Parse custom port if provided: --port=XXXX
            foreach (string arg in args)
            {
                if (arg.StartsWith("--port=", StringComparison.OrdinalIgnoreCase))
                {
                    int p;
                    if (int.TryParse(arg.Substring(7), out p))
                    {
                        serverPort = p;
                        serverUrl = "http://localhost:" + p;
                    }
                }
            }

            // 1. Terminate any previous stale process listening on this port
            KillStalePortProcess(serverPort);

            // 2. Start the SCADA backend server process
            if (!StartServerProcess())
            {
                return;
            }

            // 3. Wait for the server to accept TCP connections
            bool ready = WaitForServer(serverPort, 40); // up to 8 seconds

            // 4. Setup System Tray Icon
            SetupTrayIcon();

            // 5. Launch the Client Window (Edge App Mode or Browser)
            LaunchClientWindow();

            // 6. Monitor browser process - when the client window is closed, exit cleanly
            processMonitorTimer = new System.Windows.Forms.Timer();
            processMonitorTimer.Interval = 1000;
            processMonitorTimer.Tick += (s, e) =>
            {
                if (isExiting) return;
                if (appWindowProcess != null && appWindowProcess.HasExited)
                {
                    // User closed the SCADA desktop window
                    ExitApplication();
                }
            };
            processMonitorTimer.Start();

            // Run application message loop for tray icon and events
            Application.Run();
        }

        private static bool StartServerProcess()
        {
            string serverExe = Path.Combine(appDir, "scada_server.exe");
            string serverCjs = Path.Combine(appDir, "dist", "server_bundled.cjs");

            ProcessStartInfo psi = new ProcessStartInfo();
            psi.CreateNoWindow = true;
            psi.UseShellExecute = false;
            psi.WorkingDirectory = appDir;
            psi.EnvironmentVariables["NODE_ENV"] = "production";
            psi.EnvironmentVariables["AUTO_OPEN"] = "false";
            psi.EnvironmentVariables["PORT"] = serverPort.ToString();

            if (File.Exists(serverExe))
            {
                psi.FileName = serverExe;
            }
            else if (File.Exists(serverCjs))
            {
                psi.FileName = "node";
                psi.Arguments = "\"" + serverCjs + "\"";
            }
            else
            {
                MessageBox.Show(
                    "لم يتم العثور على ملفات تشغيل الخادم!\n" +
                    "تأكد من وجود scada_server.exe أو dist/server_bundled.cjs في مسار التطبيق.",
                    "خطأ تشغيل سكادا - SCADA Digital Twin",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }

            try
            {
                serverProcess = Process.Start(psi);
                return true;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "تعذر تشغيل خادم سكادا:\n" + ex.Message,
                    "خطأ تشغيل سكادا - SCADA Digital Twin",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return false;
            }
        }

        private static bool WaitForServer(int port, int maxAttempts)
        {
            for (int i = 0; i < maxAttempts; i++)
            {
                Thread.Sleep(200);
                try
                {
                    using (TcpClient tcp = new TcpClient())
                    {
                        IAsyncResult res = tcp.BeginConnect("127.0.0.1", port, null, null);
                        if (res.AsyncWaitHandle.WaitOne(200))
                        {
                            tcp.EndConnect(res);
                            return true;
                        }
                    }
                }
                catch { }
            }
            return false;
        }

        private static void SetupTrayIcon()
        {
            ContextMenu contextMenu = new ContextMenu();

            MenuItem itemOpen = new MenuItem("فتح نافذة سكادا (Open Window)", (s, e) => LaunchClientWindow());
            itemOpen.DefaultItem = true;
            MenuItem itemBrowser = new MenuItem("فتح في المتصفح (Default Browser)", (s, e) => OpenInDefaultBrowser());
            MenuItem itemRestart = new MenuItem("إعادة تشغيل الخادم (Restart Server)", (s, e) => RestartServer());
            MenuItem itemSep = new MenuItem("-");
            MenuItem itemExit = new MenuItem("إنهاء المنظومة (Exit SCADA)", (s, e) => ExitApplication());

            contextMenu.MenuItems.Add(itemOpen);
            contextMenu.MenuItems.Add(itemBrowser);
            contextMenu.MenuItems.Add(itemRestart);
            contextMenu.MenuItems.Add(itemSep);
            contextMenu.MenuItems.Add(itemExit);

            trayIcon = new NotifyIcon();
            trayIcon.Text = "SCADA & SAS Digital Twin 132/13.8 kV";
            trayIcon.Icon = SystemIcons.Application;
            trayIcon.ContextMenu = contextMenu;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => LaunchClientWindow();
        }

        private static void LaunchClientWindow()
        {
            try
            {
                if (appWindowProcess != null && !appWindowProcess.HasExited)
                {
                    // Already running, just bring to front
                    return;
                }

                string edgePath = FindEdgePath();
                if (!string.IsNullOrEmpty(edgePath))
                {
                    string userDataDir = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "ScadaDigitalTwin",
                        "EdgeProfile"
                    );

                    ProcessStartInfo edgePsi = new ProcessStartInfo();
                    edgePsi.FileName = edgePath;
                    edgePsi.Arguments = string.Format(
                        "--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1600,950",
                        serverUrl,
                        userDataDir
                    );
                    edgePsi.UseShellExecute = false;

                    appWindowProcess = Process.Start(edgePsi);
                }
                else
                {
                    OpenInDefaultBrowser();
                }
            }
            catch
            {
                OpenInDefaultBrowser();
            }
        }

        private static void OpenInDefaultBrowser()
        {
            try
            {
                Process.Start(new ProcessStartInfo(serverUrl) { UseShellExecute = true });
            }
            catch (Exception ex)
            {
                MessageBox.Show("تعذر فتح المتصفح: " + ex.Message);
            }
        }

        private static void RestartServer()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                    serverProcess.WaitForExit(2000);
                }
            }
            catch { }

            KillStalePortProcess(serverPort);
            StartServerProcess();
            WaitForServer(serverPort, 20);
            if (trayIcon != null)
            {
                trayIcon.ShowBalloonTip(2000, "SCADA Digital Twin", "تمت إعادة تشغيل الخادم بنجاح", ToolTipIcon.Info);
            }
        }

        private static string FindEdgePath()
        {
            string[] paths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static void KillStalePortProcess(int port)
        {
            try
            {
                Process p = new Process();
                p.StartInfo.FileName = "cmd.exe";
                p.StartInfo.Arguments = string.Format("/c for /f \"tokens=5\" %a in ('netstat -aon ^| findstr \":{0}\" ^| findstr \"LISTENING\"') do taskkill /f /pid %a", port);
                p.StartInfo.CreateNoWindow = true;
                p.StartInfo.UseShellExecute = false;
                p.Start();
                p.WaitForExit(3000);
            }
            catch { }
        }

        private static void ExitApplication()
        {
            if (isExiting) return;
            isExiting = true;

            if (processMonitorTimer != null)
            {
                processMonitorTimer.Stop();
            }

            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }

            try
            {
                if (appWindowProcess != null && !appWindowProcess.HasExited)
                {
                    appWindowProcess.Kill();
                }
            }
            catch { }

            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                }
            }
            catch { }

            KillStalePortProcess(serverPort);
            Application.Exit();
        }
    }
}
