#!/usr/bin/env python3
"""2026.11.14.1 — OpenAI Codex (GPT-6). Fixed-recipient SMTP forms."""
import email.policy,json,pathlib,re,smtplib,ssl
from email.parser import BytesParser
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import parse_qs

MAILBOX='premium-gas@mail.ru'
FIELDS={'name':120,'phone':80,'email':180,'company':300,'area':300,'culture':120,
        'object':300,'model':160,'scenario':200,'economy':200,'comment':3000,'consent':1,'website':200}

def parse_form(content_type,raw):
    if content_type.startswith('application/x-www-form-urlencoded'):
        values=parse_qs(raw.decode('utf-8'),keep_blank_values=True,max_num_fields=30)
    elif content_type.startswith('multipart/form-data;'):
        msg=BytesParser(policy=email.policy.default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+raw)
        if not msg.is_multipart():raise ValueError('multipart')
        values={}
        for part in msg.iter_parts():
            key=part.get_param('name',header='content-disposition')
            if part.get_filename() or key in values:raise ValueError('field')
            values[key]=[(part.get_payload(decode=True) or b'').decode('utf-8')]
    else:raise ValueError('content_type')
    if len(values)>30:raise ValueError('fields')
    result={}
    for key,limit in FIELDS.items():
        value=values.get(key,[''])
        if len(value)!=1 or len(value[0])>limit:raise ValueError('length')
        result[key]=value[0].strip()
    return result

class Handler(BaseHTTPRequestHandler):
    server_version='PRGZForms'
    def log_message(self,*args):pass # Never log client data or SMTP credentials.
    def reply(self,status,error=None):
        raw=json.dumps({'ok':error is None,**({'error':error} if error else {})}).encode()
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(raw)))
        self.end_headers();self.wfile.write(raw)
    def do_GET(self):self.reply(405,'method_not_allowed')
    def do_POST(self):
        self.connection.settimeout(15)
        if not re.fullmatch(r'/teplica[5-8]/handler.php',self.path):return self.reply(404,'not_found')
        if self.headers.get('Origin') not in ('https://prgz.ru','https://www.prgz.ru'):
            return self.reply(403,'origin')
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=16384:return self.reply(413,'body_size')
            f=parse_form(self.headers.get('Content-Type',''),self.rfile.read(size))
        except (ValueError,UnicodeError):return self.reply(422,'invalid_form')
        if f['website']:return self.reply(200)
        if not f['name'] or f['consent']!='1' or not 10<=len(re.sub(r'\D','',f['phone']))<=15:
            return self.reply(422,'required_fields')
        if f['email'] and not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+',f['email']):
            return self.reply(422,'invalid_email')
        msg=EmailMessage();msg['From']=MAILBOX;msg['To']=MAILBOX
        msg['Subject']='Заявка Premium-E — '+self.path.split('/')[1]
        if f['email']:msg['Reply-To']=f['email']
        labels={'name':'Имя','phone':'Телефон','email':'E-mail','company':'Компания','area':'Площадь','culture':'Культура','object':'Объект','model':'Модель','scenario':'Сценарий','economy':'Расчётная экономия','comment':'Комментарий'}
        msg.set_content('Страница: https://prgz.ru'+self.path.replace('handler.php','')+'\n\n'+'\n'.join(labels[k]+': '+f[k] for k in labels if f[k])+'\nСогласие на обработку данных: да\n')
        try:
            password=pathlib.Path('/etc/prgz-forms/smtp-password').read_text().strip()
            if not password:raise ValueError('not_configured')
            with smtplib.SMTP_SSL('smtp.mail.ru',465,context=ssl.create_default_context(),timeout=20) as smtp:
                smtp.login(MAILBOX,password);smtp.send_message(msg)
        except Exception:
            print('FORM_SMTP_FAILED',flush=True);return self.reply(503,'mail_unavailable')
        print('FORM_SMTP_ACCEPTED',flush=True);self.reply(200)

if __name__=='__main__':ThreadingHTTPServer(('127.0.0.1',18770),Handler).serve_forever()
