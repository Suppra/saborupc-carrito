// Micro frontend: CARRITO (equipo Pedidos) — Web Component en JavaScript puro
// Contrato: define la etiqueta <mfe-carrito>
// Escucha:  'carrito:agregar'     v1.x { version, id, nombre, precio }
// Publica:  'carrito:actualizado' v1.0 { version, cantidad, total }
//           'pedido:confirmado'   v1.1 { version, id, fecha, items, total, metodoPago }
//           (v1.1 agrega metodoPago a la v1.0; los consumidores de la v1.0 siguen funcionando)
(function () {
  const VERSION = '2.1.0';
  const TOKENS = 'http://localhost:8085/tokens.css';
  const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Nequi'];
  const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  if (!document.getElementById('tokens-saborupc')) {
    const link = document.createElement('link');
    link.id = 'tokens-saborupc';
    link.rel = 'stylesheet';
    link.href = TOKENS;
    document.head.appendChild(link);
  }

  // Con Shadow DOM los estilos no salen del componente; los valores vienen de los tokens
  const CSS = `
    :host { display: block; font-family: var(--sabor-fuente, Arial, sans-serif); }
    h2 { color: var(--sabor-color-primario, #0b4f8a); margin: 0 0 4px; font-size: var(--sabor-texto-xl, 24px); }
    .version { font-size: var(--sabor-texto-xs, 12px); color: var(--sabor-color-texto-suave, #777); }
    table { width: 100%; border-collapse: collapse; margin: var(--sabor-espacio-4, 16px) 0; background: var(--sabor-color-superficie, #fff); }
    th, td { padding: 10px; border-bottom: 1px solid var(--sabor-color-borde, #dde3ea); text-align: left; }
    th { background: var(--sabor-color-fondo, #eaf3fb); }
    .quitar { background: none; border: 1px solid var(--sabor-color-peligro, #c0392b); color: var(--sabor-color-peligro, #c0392b);
              border-radius: var(--sabor-radio, 4px); cursor: pointer; padding: 4px 8px; font: inherit; }
    .pie { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--sabor-espacio-4, 16px); }
    .total { font-size: var(--sabor-texto-lg, 20px); font-weight: bold; }
    label { font-size: var(--sabor-texto-sm, 14px); }
    select { padding: 8px; border-radius: var(--sabor-radio, 4px); border: 1px solid #bbb; font: inherit; }
    .confirmar { background: var(--sabor-color-primario, #0b4f8a); color: #fff; border: 0; padding: 10px 18px;
                 border-radius: var(--sabor-radio, 4px); cursor: pointer; font: inherit; }
    .vacio { color: var(--sabor-color-texto-suave, #777); }
    .exito { background: #eaf6ea; color: var(--sabor-color-acento-oscuro, #1b7a3e); padding: var(--sabor-espacio-3, 12px); border-radius: var(--sabor-radio, 4px); }
  `;

  // ---- Estado del micro frontend: vive en el módulo, no en el elemento,
  // para que sobreviva cuando el contenedor retira <mfe-carrito> de la página.
  const items = [];            // [{ id, nombre, precio, cantidad }]
  const montados = new Set();  // instancias de <mfe-carrito> conectadas ahora
  let metodoPago = METODOS_PAGO[0];
  let mensaje = '';

  function total() {
    return items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  }

  function publicar(nombre, detail) {
    window.dispatchEvent(new CustomEvent(nombre, { detail: detail }));
  }

  function publicarEstado() {
    const cantidad = items.reduce((acc, it) => acc + it.cantidad, 0);
    publicar('carrito:actualizado', { version: '1.0', cantidad: cantidad, total: total() });
  }

  function repintarTodos() {
    montados.forEach(el => el.pintar());
  }

  // Escucha desde que se carga el script (por eso el registro lo marca con precargar)
  window.addEventListener('carrito:agregar', function (e) {
    const plato = e.detail;   // lector tolerante: solo usamos id, nombre y precio
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
        this.shadowRoot.addEventListener('change', (e) => {
          if (e.target.matches('select[name="pago"]')) metodoPago = e.target.value;
        });
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
      if (mensaje) html += `<p class="exito" role="status">${mensaje}</p>`;
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
        <div class="pie">
          <span class="total">Total: ${pesos.format(total())}</span>
          <label>Pago
            <select name="pago">
              ${METODOS_PAGO.map(m => `<option ${m === metodoPago ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </label>
          <button class="confirmar">Confirmar pedido</button>
        </div>`;
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
        mensaje = 'Pedido confirmado por ' + pesos.format(total()) + ' (' + metodoPago + '). Síguelo en "Mis pedidos".';
        publicar('pedido:confirmado', {
          version: '1.1',
          id: 'P-' + Date.now(),
          fecha: new Date().toISOString(),
          items: items.map(it => ({ id: it.id, nombre: it.nombre, precio: it.precio, cantidad: it.cantidad })),
          total: total(),
          metodoPago: metodoPago          // nuevo en v1.1
        });
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
