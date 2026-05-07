<?php
require_once "api/config/database.php";

$stmt = $pdo->query("SELECT * FROM products");

while ($row = $stmt->fetch()) {
    echo $row['title'] . "<br>";
}