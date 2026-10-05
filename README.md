# mfe-carrito · SaborUPC 2.0 (equipo Pedidos)

Carrito de compras como **Web Component** (`<mfe-carrito>`, JavaScript puro con Shadow DOM).

- **Escucha:** `carrito:agregar` v1.x `{ version, id, nombre, precio }` (lector tolerante: ignora campos que no conoce).
- **Publica:** `carrito:actualizado` v1.0 `{ version, cantidad, total }` y `pedido:confirmado` **v1.1**
  `{ version, id, fecha, items, total, metodoPago }`. La v1.1 agrega `metodoPago` a la v1.0 sin romper a los consumidores.
- **Precarga:** debe cargarse aunque no esté en pantalla para no perder `carrito:agregar` (`"precargar": true` en el registro).

## Ejecutar

```bash
python -m http.server 8082
```

- Modo independiente: http://localhost:8082 (botones que simulan al catálogo)
- Prueba de contrato: http://localhost:8082/contrato.html (14 verificaciones ✓/✗)
