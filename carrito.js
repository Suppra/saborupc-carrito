// Micro frontend: CARRITO  (equipo "Pedidos") — reescrito como Web Component (reto 2)
// Contrato: define la etiqueta <mfe-carrito>
// Escucha:  'carrito:agregar'      { id, nombre, precio }
// Publica:  'carrito:actualizado'  { cantidad, total }
//           'pedido:confirmado'    { id, fecha, items, total }   (reto 1)
// Los eventos son los mismos que en la versión 1.x: el Catálogo no cambia ni una línea.
(function () {
  const VERSION = '2.0.0';

  // Reto 4: tokens del sistema de diseño compartido, servidos desde otro origen.
  // Se insertan una sola vez en la página (el id es común a todos los equipos).
  // Cada var() lleva un valor por defecto: si el servidor de tokens cae, nada se rompe.
  (function asegurarTokens() {
    if (document.getElementById('tokens-saborupc')) return;
    const link = document.createElement('link');
    link.id = 'tokens-saborupc';
    link.rel = 'stylesheet';
    link.href = 'http://localhost:8085/tokens.css';
    document.head.appendChild(link);
  })();
  const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  // Con Shadow DOM ya no hace falta el prefijo "car-": estos estilos no salen del componente
  const CSS = `
    :host { display: block; }
    h2 { color: var(--color-primario, #0b4f8a); margin: 0 0 4px; }
    .version { font-size: 12px; color: var(--color-texto-suave, #888); }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #fff; }
    th, td { padding: 10px; border-bottom: 1px solid #e3e7ec; text-align: left; }
    th { background: #eaf3fb; }
    .quitar { background: none; border: 1px solid var(--color-peligro, #c0392b); color: var(--color-peligro, #c0392b); border-radius: var(--radio, 4px); cursor: pointer; padding: 4px 8px; }
    .total { font-size: 20px; font-weight: bold; text-align: right; }
    .confirmar { background: var(--color-primario, #0b4f8a); color: #fff; border: 0; padding: 10px 18px; border-radius: var(--radio, 4px); cursor: pointer; float: right; margin-top: 12px; }
    .vacio { color: #777; }
    .exito { background: #eaf6ea; color: var(--color-acento-oscuro, #1b7a3e); padding: 12px; border-radius: var(--radio, 4px); }
  `;

  // ---- Estado del micro frontend: vive en el módulo, no en el elemento,
  // para que sobreviva cuando el contenedor retira <mfe-carrito> de la página.
  const items = [];          // [{ id, nombre, precio, cantidad }]
  const montados = new Set(); // instancias de <mfe-carrito> conectadas ahora
  let mensaje = '';

  function total() {
    return items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  }

  function publicarEstado() {
    const cantidad = items.reduce((acc, it) => acc + it.cantidad, 0);
    window.dispatchEvent(new CustomEvent('carrito:actualizado', {
      detail: { cantidad: cantidad, total: total() }
    }));
  }

  function repintarTodos() {
    montados.forEach(el => el.pintar());
  }

  // Igual que antes: escucha desde que se carga el script (el registro lo precarga)
  window.addEventListener('carrito:agregar', function (e) {
    const plato = e.detail;
    const existente = items.find(it => it.id === plato.id);
    if (existente) existente.cantidad += 1;
    else items.push({ id: plato.id, nombre: plato.nombre, precio: plato.precio, cantidad: 1 });
    mensaje = '';
    publicarEstado();
    repintarTodos();
  });

  class MfeCarrito extends HTMLElement {
    connectedCallback() {
      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.addEventListener('click', (e) => this.alHacerClic(e));
      }
      montados.add(this);
      this.pintar();
    }

    disconnectedCallback() {
      montados.delete(this);
      mensaje = '';
    }

    pintar() {
      let html = `<style>${CSS}</style>
        <h2>Tu carrito</h2>
        <span class="version">mfe-carrito v${VERSION} · Web Component</span>`;
      if (mensaje) html += `<p class="exito">${mensaje}</p>`;
      if (items.length === 0) {
        html += '<p class="vacio">El carrito está vacío. Agrega platos desde el catálogo.</p>';
      } else {
        html += `<table>
          <tr><th>Plato</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
          ${items.map(it => `<tr>
              <td>${it.nombre}</td><td>${it.cantidad}</td>
              <td>${pesos.format(it.precio * it.cantidad)}</td>
              <td><button class="quitar" data-id="${it.id}">Quitar</button></td>
            </tr>`).join('')}
        </table>
        <div class="total">Total: ${pesos.format(total())}</div>
        <button class="confirmar">Confirmar pedido</button>`;
      }
      this.shadowRoot.innerHTML = html;
    }

    alHacerClic(e) {
      if (e.target.matches('.quitar')) {
        const i = items.findIndex(it => it.id === Number(e.target.dataset.id));
        if (i >= 0) items.splice(i, 1);
        publicarEstado();
        repintarTodos();
      } else if (e.target.matches('.confirmar')) {
        mensaje = 'Pedido confirmado por ' + pesos.format(total()) + '. ¡Gracias!';
        window.dispatchEvent(new CustomEvent('pedido:confirmado', {
          detail: {
            id: Date.now(),
            fecha: new Date().toISOString(),
            items: items.map(it => ({ id: it.id, nombre: it.nombre, precio: it.precio, cantidad: it.cantidad })),
            total: total()
          }
        }));
        items.length = 0;
        publicarEstado();
        repintarTodos();
      }
    }
  }

  if (!customElements.get('mfe-carrito')) {
    customElements.define('mfe-carrito', MfeCarrito);
  }
})();
