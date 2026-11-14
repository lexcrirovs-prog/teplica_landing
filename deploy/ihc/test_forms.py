import importlib.util,pathlib,unittest,threading,urllib.request,urllib.error
from unittest.mock import patch,MagicMock
s=importlib.util.spec_from_file_location('forms',pathlib.Path(__file__).with_name('form-server.py'))
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class FormsTests(unittest.TestCase):
 def test_duplicate_fields_rejected(self):
  with self.assertRaises(ValueError):m.parse_form('application/x-www-form-urlencoded',b'name=x&name=y')
 def test_multipart_browser_form(self):
  raw=b'--boundary\r\nContent-Disposition: form-data; name="name"\r\n\r\nEngineer\r\n--boundary--\r\n'
  self.assertEqual(m.parse_form('multipart/form-data; boundary=boundary',raw)['name'],'Engineer')
 def request(self,fields,origin='https://prgz.ru',smtp_error=False):
  server=m.ThreadingHTTPServer(('127.0.0.1',0),m.Handler)
  t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
  try:
   with patch.object(m.pathlib.Path,'read_text',return_value='test-password'),patch.object(m.smtplib,'SMTP_SSL') as smtp:
    if smtp_error:smtp.side_effect=OSError('offline')
    req=urllib.request.Request(f'http://127.0.0.1:{server.server_port}/teplica8/handler.php',data=fields.encode(),headers={'Origin':origin,'Content-Type':'application/x-www-form-urlencoded'})
    try:
     with urllib.request.urlopen(req) as r:status=r.status
    except urllib.error.HTTPError as e:status=e.code;e.close()
    return status,smtp
  finally:server.shutdown();server.server_close();t.join()
 def test_smtp_failure_never_returns_success(self):
  status,_=self.request('name=Test&phone=88007005133&consent=1',smtp_error=True)
  self.assertEqual(status,503)
 def test_foreign_origin_cannot_send(self):
  status,smtp=self.request('name=Test&phone=88007005133&consent=1','https://foreign.example')
  self.assertEqual(status,403);smtp.assert_not_called()
 def test_consent_required(self):
  status,smtp=self.request('name=Test&phone=88007005133')
  self.assertEqual(status,422);smtp.assert_not_called()
 def test_fixed_recipient(self):
  status,smtp=self.request('name=Test&phone=88007005133&consent=1&to=other@example.com')
  self.assertEqual(status,200)
  msg=smtp.return_value.__enter__.return_value.send_message.call_args.args[0]
  self.assertEqual(msg['To'],m.MAILBOX)
if __name__=='__main__':unittest.main()
