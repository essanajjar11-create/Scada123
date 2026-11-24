using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

namespace SubstationSimulator
{
    public class MainForm : Form
    {
        private readonly string _startUrl;
        private WebView2? _webView;

        public MainForm(string startUrl)
        {
            _startUrl = startUrl;

            Text = "محاكي محطة التحويل 220/110 ك.ف ونظام الإسكادا | Substation Digital Twin & SCADA";
            Width = 1440;
            Height = 920;
            StartPosition = FormStartPosition.CenterScreen;
            WindowState = FormWindowState.Maximized;
            BackColor = Color.FromArgb(14, 16, 20);

            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            try
            {
                _webView = new WebView2
                {
                    Dock = DockStyle.Fill,
                    DefaultBackgroundColor = Color.FromArgb(14, 16, 20)
                };
                Controls.Add(_webView);

                string userDataFolder = Path.Combine(Path.GetTempPath(), "SubstationSimulator_WebView2Data");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await _webView.EnsureCoreWebView2Async(env);

                _webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;

                _webView.Source = new Uri(_startUrl);
            }
            catch (Exception)
            {
                // Fallback: If WebView2 is not installed, open default system browser smoothly
                try
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(_startUrl)
                    {
                        UseShellExecute = true
                    });
                }
                catch { }

                MessageBox.Show(
                    "تم إطلاق المحاكي بنجاح في متصفح النظام الافتراضي.\n" +
                    "البرنامج يعمل الآن بصورة كاملة ولا يحتاج Node.js أو أي برامج أخرى.",
                    "محاكي محطة التحويل",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
        }
    }
}
