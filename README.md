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

## Novedades 3.7 (iconos y ajustes finales)

- 3.9: usuarios Sara Pozos y Valeria Fuentes. Matriz master data (matriz.js, código → familia) para reconocer el tipo de producto en la validación de lotes. Aviso de lote que no corresponde al tipo de producto (jabones terminan en XX; shampoo, no) en Recibo y Surtido. Pendientes del equipo (compartidos por servidor, se actualizan cada 30 s; quien toma uno se lo queda). Usuario Ariadna Salcedo. Capa "Seguridad" en el Layout 3D (evacuación, salidas, extintores, zonas de celular, peligro eléctrico, lámparas UV, control de plagas). Montacargas solo en su carril, a 5 km/h y con baliza; conos en la zona de junta. Acceso solo con nombre, apellido y código (4 usuarios autorizados; sin invitados ni registro). Layout 3D animado: junta en Recibo, montacargas subiendo tarima al rack, montacargas trasladando tarima y personas que saludan a la cámara.

- 3.8.3: la muestra AQL se revisa por renglones: se sortean LPN y, dentro de cada una, solo los renglones necesarios para completar las cajas de la muestra. Botón "Pasar a 100%" y textos aclarados.

- 3.8.2: banderas en el Layout 3D (Ir a Recibo, Surtido, Maquila, Pendientes, Historial) y colores por proceso en el menú.

- 3.8.1: el icono de temporada se fija desde el <head> (antes de que cargue la app) y Perfil muestra "Icono de hoy". Para ver el icono nuevo en la pantalla de inicio hay que borrar el acceso directo y volver a agregarlo.

- 3.8.0: la inspección AQL cuenta CAJAS (suma de las cajas de todas las LPN/tarimas; LPN repetida = misma tarima). Letra y muestra salen de ese total.

- Layout 3D 3.7.13: STCRyDA sin reja al oeste/norte, rejas nuevas al este y sur, jaula extendida al oeste, control de acceso solo escritorio.

- Layout 3D 3.7.12: filas B70–B75 repartidas (B75 = rack pegado al muro este), jaula a espalda de B70, botes junto a B70, STCRyDA sin encierro, paso peatonal conectado, DOOR079 y salida de emergencia intercambiadas.

- Layout 3D 3.7.11: solo 6 filas de racks (B70–B75), zona STCRyDA con tarimas y 2 pilares, jaula hasta el muro oeste, garita de acceso, DOOR079, salida de emergencia y caminos peatonales.

- Layout 3D 3.7.10: filas B70–B75 rotuladas, rack pegado al muro este dividido por salida de emergencia, jaula CRyD tras la reja del fondo, franja sanitaria, puertas corredizas de montacargas.

- Layout 3D: mesa de inspección en el rectángulo amarillo, pasillos entre cubículos, zona de producto sobre tarimas y todas las tarimas CHEP azules.
- Icono "SMO CRyD" con versión de temporada (calavera y cempasúchil, gorro navideño, calabaza y un emblema por mes). Iconos: ati-*.png
- Layout 3D: se muestra las primeras 7 veces que se abre la app cada día.
- Conteo ciego: cantidades ocultas hasta el final de cada LPN. La foto lee código y lote y se ve más grande.

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
