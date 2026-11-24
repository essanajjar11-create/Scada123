using System;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SubstationSimulator
{
    static class Program
    {
        private static HttpListener? _listener;
        private static int _port;

        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();

            // 1. Get a random free loopback port
            _port = GetFreePort();

            // 2. Start in-memory static HTTP server
            StartServer(_port);

            // 3. Run the desktop application window
            var form = new MainForm($"http://127.0.0.1:{_port}/index.html");
            Application.Run(form);

            // 4. Shutdown
            try
            {
                _listener?.Stop();
                _listener?.Close();
            }
            catch { }
        }

        private static int GetFreePort()
        {
            var l = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
        }

        private static void StartServer(int port)
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{port}/");
            _listener.Start();

            Task.Run(async () =>
            {
                var assembly = Assembly.GetExecutingAssembly();
                while (_listener != null && _listener.IsListening)
                {
                    try
                    {
                        var context = await _listener.GetContextAsync();
                        _ = ProcessRequest(context, assembly);
                    }
                    catch
                    {
                        break;
                    }
                }
            });
        }

        private static async Task ProcessRequest(HttpListenerContext context, Assembly assembly)
        {
            try
            {
                string rawUrl = context.Request.RawUrl ?? "/";
                if (rawUrl == "/" || string.IsNullOrEmpty(rawUrl.Trim('/')))
                {
                    rawUrl = "/index.html";
                }

                // Strip query string if any
                int qIdx = rawUrl.IndexOf('?');
                if (qIdx >= 0) rawUrl = rawUrl.Substring(0, qIdx);

                string relativePath = rawUrl.TrimStart('/');
                // Resource name format: SubstationSimulator.dist.<subfolder>.<file>
                string resourceName = "SubstationSimulator.dist." + relativePath.Replace('/', '.');

                Stream? stream = assembly.GetManifestResourceStream(resourceName);
                if (stream == null)
                {
                    // Fallback search by filename match
                    string fileName = Path.GetFileName(relativePath);
                    foreach (var name in assembly.GetManifestResourceNames())
                    {
                        if (name.EndsWith(fileName, StringComparison.OrdinalIgnoreCase))
                        {
                            stream = assembly.GetManifestResourceStream(name);
                            break;
                        }
                    }
                }

                if (stream != null)
                {
                    string ext = Path.GetExtension(rawUrl).ToLowerInvariant();
                    context.Response.ContentType = ext switch
                    {
                        ".html" => "text/html; charset=utf-8",
                        ".js" => "application/javascript; charset=utf-8",
                        ".css" => "text/css; charset=utf-8",
                        ".svg" => "image/svg+xml",
                        ".png" => "image/png",
                        ".jpg" or ".jpeg" => "image/jpeg",
                        ".json" => "application/json",
                        ".woff2" => "font/woff2",
                        ".woff" => "font/woff",
                        ".ttf" => "font/ttf",
                        _ => "application/octet-stream"
                    };

                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    await stream.CopyToAsync(context.Response.OutputStream);
                    stream.Dispose();
                }
                else
                {
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                }
            }
            catch
            {
                try { context.Response.StatusCode = (int)HttpStatusCode.InternalServerError; } catch { }
            }
            finally
            {
                try { context.Response.Close(); } catch { }
            }
        }
    }
}
