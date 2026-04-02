from __future__ import annotations


def test_health_check_returns_ok(client) -> None:
    response = client.get('/health')

    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_cors_allows_frontend_origin(client) -> None:
    response = client.options(
        '/health',
        headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
        },
    )

    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'http://localhost:3000'
