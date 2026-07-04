<?php
// Обработчик формы расчёта — лендинг тепличных котлов Premium-E (prgz.ru/teplica5).
// ВАЖНО: Beget отдаёт PHP 5.6 в этой папке — только 5.6-совместимый синтаксис
// (никаких ??, стрелочных функций, [] можно; используем array()).
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('ok' => false, 'error' => 'method'));
    exit;
}

function fld($k) {
    return isset($_POST[$k]) ? trim($_POST[$k]) : '';
}

$name    = fld('name');
$phone   = fld('phone');
$email   = fld('email');
$company = fld('company');
$area    = fld('area');
$comment = fld('comment');

if ($name === '' || $phone === '') {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'error' => 'required'));
    exit;
}

$to = 'premium-gas@mail.ru';

$subjectText = 'Заявка на расчёт комплекса Premium-E (теплицы) — prgz.ru/teplica5';
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';

$lines = array();
$lines[] = 'Новая заявка с лендинга тепличных котлов Premium-E (prgz.ru/teplica5)';
$lines[] = '';
$lines[] = 'Имя: ' . $name;
$lines[] = 'Телефон: ' . $phone;
$lines[] = 'E-mail: ' . ($email !== '' ? $email : '—');
$lines[] = 'Компания / хозяйство: ' . ($company !== '' ? $company : '—');
$lines[] = 'Площадь теплиц (га) / мощность: ' . ($area !== '' ? $area : '—');
$lines[] = 'Комментарий: ' . ($comment !== '' ? $comment : '—');
$body = implode("\r\n", $lines);

$headers = array();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: Premium-E Теплицы <noreply@prgz.ru>';
// Контакт клиента — в Reply-To (иначе Beget режет письма с чужим From).
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

echo json_encode(array('ok' => $sent ? true : false));
