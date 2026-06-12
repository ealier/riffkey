<?php

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? 'list';

// Простая проверка на "админку" по сессии (упрощённо)
session_start();
$isAdmin = !empty($_SESSION['user']) && !empty($_SESSION['user']['is_admin']);

function json_response($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = db();

    if ($method === 'GET' && $action === 'list') {
        $stmt = $pdo->query('SELECT * FROM products ORDER BY id DESC');
        $rows = $stmt->fetchAll();

        $products = array_map(function (array $row) {
            return [
                'id'           => (int)$row['id'],
                'name'         => $row['name'],
                'brand'        => $row['brand'],
                'price'        => (int)$row['price'],
                'oldPrice'     => $row['old_price'] !== null ? (int)$row['old_price'] : null,
                'discount'     => $row['discount'] !== null ? (int)$row['discount'] : null,
                'image'        => $row['image'],
                'images'       => $row['images'] ? json_decode($row['images'], true) : [],
                'badge'        => $row['badge'],
                'category'     => $row['category'],
                'colors'       => $row['colors'] ? json_decode($row['colors'], true) : [],
                'sizes'        => $row['sizes'] ? json_decode($row['sizes'], true) : [],
                'description'  => $row['description'],
                'rating'       => $row['rating'] !== null ? (float)$row['rating'] : null,
                'reviewsCount' => $row['reviews_count'] !== null ? (int)$row['reviews_count'] : null,
                'inStock'      => (bool)$row['in_stock'],
            ];
        }, $rows);

        json_response([
            'success'  => true,
            'products' => $products,
        ]);
    }

    if (!$isAdmin) {
        json_response(['success' => false, 'message' => 'Нет прав'], 403);
    }

    // Ниже — только для админ-панели
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    if ($method === 'POST' && $action === 'create') {
        $stmt = $pdo->prepare('
            INSERT INTO products
              (name, brand, price, old_price, discount, image, images, badge, category, colors, sizes, description, rating, reviews_count, in_stock)
            VALUES
              (:name, :brand, :price, :old_price, :discount, :image, :images, :badge, :category, :colors, :sizes, :description, :rating, :reviews_count, :in_stock)
        ');

        $stmt->execute([
            ':name'         => $input['name'] ?? '',
            ':brand'        => $input['brand'] ?? 'YANKI',
            ':price'        => $input['price'] ?? 0,
            ':old_price'    => $input['oldPrice'] ?? null,
            ':discount'     => $input['discount'] ?? null,
            ':image'        => $input['image'] ?? '',
            ':images'       => isset($input['images']) ? json_encode($input['images'], JSON_UNESCAPED_UNICODE) : '[]',
            ':badge'        => $input['badge'] ?? null,
            ':category'     => $input['category'] ?? null,
            ':colors'       => isset($input['colors']) ? json_encode($input['colors'], JSON_UNESCAPED_UNICODE) : '[]',
            ':sizes'        => isset($input['sizes']) ? json_encode($input['sizes'], JSON_UNESCAPED_UNICODE) : '[]',
            ':description'  => $input['description'] ?? '',
            ':rating'       => $input['rating'] ?? null,
            ':reviews_count'=> $input['reviewsCount'] ?? null,
            ':in_stock'     => !empty($input['inStock']) ? 1 : 0,
        ]);

        $id = (int)$pdo->lastInsertId();

        json_response([
            'success' => true,
            'id'      => $id,
        ], 201);
    }

    if ($method === 'POST' && $action === 'update') {
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        if ($id <= 0) {
            json_response(['success' => false, 'message' => 'Неверный ID'], 400);
        }

        $stmt = $pdo->prepare('
            UPDATE products SET
              name = :name,
              brand = :brand,
              price = :price,
              old_price = :old_price,
              discount = :discount,
              image = :image,
              images = :images,
              badge = :badge,
              category = :category,
              colors = :colors,
              sizes = :sizes,
              description = :description,
              rating = :rating,
              reviews_count = :reviews_count,
              in_stock = :in_stock
            WHERE id = :id
        ');

        $stmt->execute([
            ':id'            => $id,
            ':name'          => $input['name'] ?? '',
            ':brand'         => $input['brand'] ?? 'YANKI',
            ':price'         => $input['price'] ?? 0,
            ':old_price'     => $input['oldPrice'] ?? null,
            ':discount'      => $input['discount'] ?? null,
            ':image'         => $input['image'] ?? '',
            ':images'        => isset($input['images']) ? json_encode($input['images'], JSON_UNESCAPED_UNICODE) : '[]',
            ':badge'         => $input['badge'] ?? null,
            ':category'      => $input['category'] ?? null,
            ':colors'        => isset($input['colors']) ? json_encode($input['colors'], JSON_UNESCAPED_UNICODE) : '[]',
            ':sizes'         => isset($input['sizes']) ? json_encode($input['sizes'], JSON_UNESCAPED_UNICODE) : '[]',
            ':description'   => $input['description'] ?? '',
            ':rating'        => $input['rating'] ?? null,
            ':reviews_count' => $input['reviewsCount'] ?? null,
            ':in_stock'      => !empty($input['inStock']) ? 1 : 0,
        ]);

        json_response(['success' => true]);
    }

    if ($method === 'POST' && $action === 'delete') {
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        if ($id <= 0) {
            json_response(['success' => false, 'message' => 'Неверный ID'], 400);
        }

        $stmt = $pdo->prepare('DELETE FROM products WHERE id = :id');
        $stmt->execute([':id' => $id]);

        json_response(['success' => true]);
    }

    json_response(['success' => false, 'message' => 'Неизвестное действие'], 400);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Серверная ошибка'], 500);
}

