# Procesos CRyD

App web para el área CRyD. Funciona en iPhone, Android y computadora, y se puede agregar a la pantalla de inicio.

## Qué incluye
- **Maquila:** formato de inspección y muestreo (hasta 5 lotes por folio), lectura de código, lote y descripción desde foto o galería, folio automático, pendientes, historial por mes y PDF.
- **Validación SAP vs PrIME:** compara código (GCAS), lote, planta, sloc, cantidades y estatus, e indica la fila de cada archivo. Solo PrIME trae LPN.
  - SAP: ignora Bloqueado, Base Unit of Measure, Transit and Transfer y la última fila. Libre y Calidad vienen en columnas separadas.
  - PrIME: solo lee de la columna A a la H. El estatus viene escrito en una columna y se asigna a Libre, Calidad o Ignorar.
- **Recibo:** sube el Excel con LPN, valida cada LPN (foto de la etiqueta, foto de código y lote por separado o juntos) contra el Excel y avisa diferencias de código, lote o cantidad.
- **Administrador:** en Perfil, con código propio, para ver y gestionar cuentas e invitados (requiere el servidor).
- **Cuentas:** nombre, apellido y número de empleado, con PIN opcional. También hay modo invitado.

## Publicar en GitHub Pages
1. Crea un repositorio público.
2. Sube todos los archivos sueltos, en la raíz.
3. Settings → Pages → Deploy from a branch → main → / (root).

## Datos
Cuentas y folios se guardan solo en el navegador de cada dispositivo. Los Excel se leen en el dispositivo y no se suben a ningún lado. Exporta respaldos desde Historial.

## Respaldo en servidor (opcional)
La app copia sola folios, folio en captura y cuenta a un servidor Firebase Realtime Database (gratis). Sin internet queda pendiente y se envía al volver.
1. console.firebase.google.com → Agregar proyecto → Build → Realtime Database → Crear base de datos (modo de prueba).
2. Copia la URL (ej. https://mi-proyecto-default-rtdb.firebaseio.com).
3. En la app: Perfil → Respaldo en servidor → pegar URL → Conectar.
4. Para que todos tus compañeros la usen sin configurar: pon la URL en `CLOUD_DEFAULT` en app.js.
Nota: en modo de prueba cualquiera con la URL puede leer los datos; no guardes información sensible.
