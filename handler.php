<?php
// Production form handler for https://prgz.ru/teplica8/.
// Kept compatible with PHP 5.6 used by this Beget account.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, max-age=0');

function respond($status, $payload) {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, array('ok' => false, 'error' => 'method_not_allowed'));
}

function field($key) {
    if (!isset($_POST[$key]) || is_array($_POST[$key])) {
        return '';
    }
    return trim((string) $_POST[$key]);
}

function clipped($value, $length) {
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $length, 'UTF-8');
    }
    return substr($value, 0, $length);
}

// A filled honeypot is treated as a successful no-op to avoid helping bots.
if (field('website') !== '') {
    respond(200, array('ok' => true));
}

$name = clipped(field('name'), 120);
$phone = clipped(field('phone'), 80);
$email = clipped(field('email'), 180);
$culture = clipped(field('culture'), 120);
$object = clipped(field('object'), 300);
$model = clipped(field('model'), 160);
$scenario = clipped(field('scenario'), 200);
$economy = clipped(field('economy'), 200);
$comment = clipped(field('comment'), 3000);
$consent = field('consent');

if ($name === '' || $phone === '' || $consent !== '1') {
    respond(422, array('ok' => false, 'error' => 'required_fields'));
}

$digits = preg_replace('/\D+/', '', $phone);
if (strlen($digits) < 10) {
    respond(422, array('ok' => false, 'error' => 'invalid_phone'));
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, array('ok' => false, 'error' => 'invalid_email'));
}

$to = 'premium-gas@mail.ru';
$subjectText = 'Заявка Premium-E для теплиц — prgz.ru/teplica8';
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';

$lines = array(
    'Новая заявка с лендинга Premium-E для тепличных комбинатов',
    'Страница: https://prgz.ru/teplica8/',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'E-mail: ' . ($email !== '' ? $email : '—'),
    'Культура: ' . ($culture !== '' ? $culture : '—'),
    'Площадь / мощность: ' . ($object !== '' ? $object : '—'),
    'Модель котла: ' . ($model !== '' ? $model : '—'),
    'Сценарий сравнения: ' . ($scenario !== '' ? $scenario : '—'),
    'Расчётная экономия: ' . ($economy !== '' ? $economy : '—'),
    'Комментарий: ' . ($comment !== '' ? $comment : '—'),
    'Согласие на обработку данных: да'
);
$body = implode("\r\n", $lines);

$headers = array(
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Premium-E Теплицы <noreply@prgz.ru>'
);
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));
if (!$sent) {
    respond(500, array('ok' => false, 'error' => 'mail_failed'));
}

respond(200, array('ok' => true));

