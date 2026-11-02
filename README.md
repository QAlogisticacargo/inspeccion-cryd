# Portal de Logística | Site SMO CRyD v3.7

Logística-Cargo | Desarrollado por D-Umbral.

App web (PWA) para el proceso CRyD: Recibo, Surtido, Validación SAP vs PrIME, Maquila, Pendientes, Historial, Dashboards y Perfil.

URL: https://qalogisticacargo.github.io/inspeccion-cryd/

## Archivos
index.html, styles.css, assets.js, app.js, lpn.js, dash.js, home.js, main.js, sw.js, manifest.webmanifest, icon-192.png, icon-512.png, apple-touch-icon.png

Sube TODOS al repositorio (reemplaza los existentes).

## Acceso
- Invitado: botón "Entrar" (nombre opcional).
- Administrador: "Acceso administrador".

## Novedades 3.7 (eliminar con doble confirmación)
- Historial y Pendientes: botón Eliminar en LPN, registros del historial y dashboards, con doble confirmación. Perfil: botón "Buscar actualización" y línea de versión de archivos.

## Novedades 3.7 (icono de temporada)
- El icono del encabezado (y la pestaña del navegador) cambia solo según la fecha en México: Año Nuevo, Reyes, Amor y Amistad, Bandera, Primavera, Día del Niño, Batalla de Puebla, Madres, Padre, verano, regreso a clases, Fiestas Patrias, Octubre Rosa, Halloween, Día de Muertos, Revolución, Guadalupe y Navidad. Archivo: temporada.js

## Novedades 3.7 (ajustes)
- Conteo ciego: no se muestra la cantidad esperada hasta después de capturar la tuya.
- Si en AQL se juntan N renglones con diferencia (configurable), la app propone pasar a 100%.
- Cada diferencia pide motivo y foto antes de firmar.
- Sorteo repartido en más tarimas y muestra cuántos códigos cubre.
- Piezas por caja validadas por código (se guardan y se reutilizan).
- Análisis: Pareto por tipo de error, código, turno e inspector, y tasa semanal.

## Novedades 3.7
- Recibo y Surtido: inspección **Total** o **AQL General II** (tabla ISO 2859-1). La app lee piezas por caja de la descripción (IT = piezas sueltas), calcula la muestra y sortea LPN completas al 100%.
- Confirmación de LPN (foto o manual), captura de código, lote (año/día + planta fija + 2 finales) y cantidad por renglón, con validación del año y día juliano. Lo que no coincide queda pendiente hasta terminar la LPN. Firma con nombre del inspector.

## Novedades 3.6
- Sección **Layout 3D** (menú de inicio y "Más"): recorrido 3D del área de maquila y la nave. Se carga solo al abrirla (`layout3d.html`).
- Presentación del layout al entrar, **una vez al día por usuario**, con botón "Entrar" para saltarla. Se puede desactivar en Perfil. Se omite en teléfonos muy limitados o con movimiento reducido.
