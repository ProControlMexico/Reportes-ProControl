/* Catálogo de códigos de error de ProControl — UNA sola fuente: lo usan index.html (mensajes en pantalla)
   y manual.html (tabla "Códigos de error"). Para agregar uno: nueva línea aquí y llamar mostrarError('E###', detalle).
   r: 1 = además se manda por email al administrador (Worker /log); solo fallos reales, no equivocaciones del usuario ni errores de Gemini (el Worker ya los avisa)
   n: 'e' = error (el mensaje se queda hasta pulsar "Entendido") | 'a' = aviso (se cierra solo a los 8 s)
   c: categoría (agrupa la tabla del manual) | d: dónde ocurre | m: qué significa | s: qué hacer
   Numeración: E1xx configuración · E2xx servicio · E3xx extraordinario · E4xx exportar · E5xx importar y autoguardado
               E6xx fotos y datos del cliente · E7xx IA · E8xx gráficas e impresión · E9xx fallos inesperados de la página */
window.ERRORES = {
    // ── Configuración y estaciones ──
    E101: { c: 'Configuración y estaciones', n: 'e', d: 'Agregar estaciones', m: 'Falta elegir el cordón o el tipo de estación.', s: 'Selecciona un cordón y un tipo en las listas antes de agregar.' },
    E102: { c: 'Configuración y estaciones', n: 'e', d: 'Agregar estaciones', m: 'La cantidad de estaciones no es válida.', s: 'Escribe un número entero de 1 en adelante.' },
    E103: { c: 'Configuración y estaciones', n: 'e', d: 'Renombrar una estación', m: 'Ya existe una estación con ese ID.', s: 'Usa otro ID: no pueden repetirse.' },
    E104: { c: 'Configuración y estaciones', n: 'e', d: 'Guardar la configuración', m: 'Falta el nombre del cliente.', s: 'Escríbelo en "Nombre del cliente" y vuelve a guardar la configuración.' },
    E105: { c: 'Configuración y estaciones', n: 'e', d: 'Guardar la configuración', m: 'Todavía no hay estaciones registradas.', s: 'Agrega al menos una estación antes de guardar la configuración.' },

    // ── Servicio ──
    E201: { c: 'Servicio', n: 'e', d: 'Iniciar un servicio (normal o extraordinario)', m: 'No hay una fecha de servicio válida.', s: 'Elige la fecha en el calendario "Fecha del servicio".' },
    E202: { c: 'Servicio', n: 'e', d: 'Iniciar el servicio normal', m: 'Ya existe un servicio guardado con esa fecha.', s: 'Elige otra fecha, o edita ese servicio desde "Servicios Registrados".' },
    E203: { c: 'Servicio', n: 'a', d: 'Botón Iniciar reporte de captura', m: 'Ya hay un servicio normal en curso (el botón se ve atenuado).', s: 'Termínalo o cancélalo desde "Servicio activo" antes de iniciar otro.' },

    // ── Servicio extraordinario ──
    E301: { c: 'Servicio extraordinario', n: 'e', d: 'Editar un servicio estando en un extraordinario', m: 'Hay un servicio extraordinario abierto.', s: 'Termínalo con la palomita verde del renglón "EDITANDO" (o descártalo con el bote de basura) y luego edita el otro.' },
    E302: { c: 'Servicio extraordinario', n: 'e', d: 'Iniciar un extraordinario', m: 'Hay un servicio normal en curso.', s: 'Termínalo o cancélalo antes de iniciar un servicio extraordinario.' },
    E303: { c: 'Servicio extraordinario', n: 'e', d: 'Editar un extraordinario', m: 'Hay un servicio en curso.', s: 'Termínalo o descártalo antes de editar un extraordinario.' },
    E304: { c: 'Servicio extraordinario', n: 'a', d: 'Botón Servicio extraordinario', m: 'Ya hay un servicio extraordinario abierto (el botón se ve atenuado). Esto pasa, por ejemplo, al importar o restaurar un archivo exportado con uno abierto.', s: 'Para iniciar otro, termina el abierto con la palomita verde del renglón "EDITANDO" (se guarda) o descártalo con el bote de basura.' },

    // ── Exportar (guardar) ──
    E401: { c: 'Exportar (guardar)', n: 'e', d: 'Botón Exportar', m: 'El modo TEST está activo.', s: 'Apaga el modo TEST (botón morado) antes de exportar. En modo TEST tampoco funciona el autoguardado.' },
    E402: { c: 'Exportar (guardar)', n: 'e', d: 'Botón Exportar', m: 'No hay un cliente configurado.', s: 'Configura el cliente (o importa un proyecto) antes de exportar.' },
    E403: { c: 'Exportar (guardar)', n: 'e', r: 1, d: 'Botón Exportar, diálogo "Guardar como"', m: 'No se pudo escribir el archivo elegido; puede haber quedado vacío o incompleto.', s: 'NO uses ese archivo. Se descarga una copia automática en Descargas: revisa que pese más de 0 KB. Si no aparece, exporta de nuevo o abre la página en Chrome/Edge. Si guardas dentro de OneDrive, prueba en una carpeta local.' },
    E404: { c: 'Exportar (guardar)', n: 'e', r: 1, d: 'Botón Exportar, descarga', m: 'El navegador no pudo generar la descarga. El proyecto NO se guardó.', s: 'Exporta de nuevo. Si pasa otra vez, abre la página en Chrome/Edge (no en el navegador de WhatsApp o del correo).' },
    E405: { c: 'Exportar (guardar)', n: 'e', r: 1, d: 'Botón Exportar con un extraordinario abierto', m: 'El extraordinario abierto está incompleto y NO se guardó en Servicios Registrados: el archivo solo lleva un borrador.', s: 'Marca al menos un trabajo (y escribe qué es "Otro" si lo marcaste) y exporta otra vez.' },
    E406: { c: 'Exportar (guardar)', n: 'e', r: 1, d: 'Botón Exportar, al armar el archivo', m: 'No se pudo preparar el archivo del proyecto. El proyecto NO se guardó.', s: 'Suele ser falta de memoria por muchas fotos pesadas. Cierra otras pestañas, quita o reduce fotos y exporta de nuevo.' },

    // ── Importar y autoguardado ──
    E501: { c: 'Importar y autoguardado', n: 'e', r: 1, d: 'Botón Importar', m: 'El archivo no es un proyecto de ProControl o está dañado.', s: 'Elige un .json exportado desde esta plataforma, sin editarlo a mano.' },
    E502: { c: 'Importar y autoguardado', n: 'e', r: 1, d: 'Botón Importar', m: 'El archivo no es un JSON válido (incompleto, vacío o descarga cortada).', s: 'Revisa que pese más de 0 KB y vuelve a descargarlo o pídelo de nuevo.' },
    E503: { c: 'Importar y autoguardado', n: 'e', r: 1, d: 'Botón Importar, al cargar los datos', m: 'Se leyó el archivo pero falló al cargarlo en pantalla; la página puede haber quedado a medias.', s: 'Recarga con Ctrl+F5 e importa de nuevo. Si se repite, manda el archivo y este código a soporte.' },
    E504: { c: 'Importar y autoguardado', n: 'e', r: 1, d: 'Botón Importar', m: 'No se pudo leer el archivo.', s: 'Si está en OneDrive, descárgalo o cópialo a una carpeta local ("Mantener siempre en este dispositivo") y vuelve a importar.' },
    E505: { c: 'Importar y autoguardado', n: 'e', r: 1, d: 'Autoguardado en el navegador', m: 'El autoguardado no funciona en este navegador: si refrescas o cierras, se pierde lo que no exportaste.', s: 'Exporta el JSON seguido. Causas comunes: ventana privada, datos del sitio bloqueados, almacenamiento lleno o navegador integrado (WhatsApp, correo).' },
    E506: { c: 'Importar y autoguardado', n: 'e', r: 1, d: 'Aviso "Se encontró un avance sin exportar"', m: 'No se pudo restaurar el avance guardado en el navegador.', s: 'Importa tu último JSON exportado. El avance dañado se descartó.' },

    // ── Fotos y datos del cliente ──
    E601: { c: 'Fotos y datos del cliente', n: 'e', r: 1, d: 'Subir fotos', m: 'Una o más fotos no se pudieron cargar (no son imagen o no se pudieron leer).', s: 'Usa JPG o PNG. Si la foto está solo en la nube (OneDrive/Fotos), descárgala primero.' },
    E604: { c: 'Fotos y datos del cliente', n: 'a', d: 'Datos del cliente, código postal', m: 'No se encontró el código postal.', s: 'Escribe la ciudad y el estado a mano.' },

    // ── Diagnóstico con IA ──
    E701: { c: 'Diagnóstico con IA', n: 'e', d: 'Generar Análisis IA', m: 'La IA respondió con un error.', s: 'Espera un minuto y genera de nuevo. Si el detalle habla de cuota o límite, se agotó el uso gratuito del momento.' },
    E702: { c: 'Diagnóstico con IA', n: 'e', r: 1, d: 'Generar Análisis IA', m: 'La IA no devolvió texto.', s: 'Genera de nuevo; si se repite, simplifica el contexto adicional.' },
    E703: { c: 'Diagnóstico con IA', n: 'e', r: 1, d: 'Generar Análisis IA', m: 'La IA respondió sin texto.', s: 'Genera de nuevo. Si se repite, avisa a soporte (puede ser la clave de la IA en el servidor).' },
    E704: { c: 'Diagnóstico con IA', n: 'e', d: 'Generar Análisis IA', m: 'No se pudo conectar con la IA.', s: 'Revisa tu internet (o VPN/firewall de la empresa) y genera de nuevo.' },
    E705: { c: 'Diagnóstico con IA', n: 'a', d: 'Generar Análisis IA', m: 'El diagnóstico quedó incompleto.', s: 'Genera de nuevo y revisa el texto antes de exportar el PDF.' },
    E706: { c: 'Diagnóstico con IA', n: 'e', r: 1, d: 'Generar Análisis IA, antes de enviar', m: 'Falló la preparación del análisis dentro de la página.', s: 'Genera de nuevo. Si se repite, recarga (Ctrl+F5), importa tu JSON y avisa a soporte con este código.' },

    // ── Gráficas e impresión ──
    E801: { c: 'Gráficas e impresión', n: 'e', d: 'Maximizar tendencias', m: 'No hay un cliente configurado.', s: 'Configura el cliente (o importa un proyecto) primero.' },
    E802: { c: 'Gráficas e impresión', n: 'e', d: 'Imprimir / guardar PDF', m: 'No hay un cliente configurado.', s: 'Configura el cliente (o importa un proyecto) primero.' },
    E803: { c: 'Gráficas e impresión', n: 'a', d: 'Gráficas en ventana nueva', m: 'El navegador bloqueó la ventana emergente.', s: 'Permite las ventanas emergentes de este sitio (icono en la barra de direcciones) y repite.' },
    E804: { c: 'Gráficas e impresión', n: 'a', d: 'Gráficas en ventana nueva', m: 'No hay datos para mostrar en esa gráfica.', s: 'Registra capturas o servicios y vuelve a intentar.' },
    E805: { c: 'Gráficas e impresión', n: 'e', r: 1, d: 'Imprimir / guardar PDF', m: 'El navegador no pudo abrir la impresión.', s: 'Recarga (Ctrl+F5), importa tu JSON y repite. Prueba en Chrome/Edge.' },

    // ── Fallos inesperados de la página ──
    E900: { c: 'Fallos inesperados de la página', n: 'e', d: 'Cualquier parte', m: 'Ocurrió un error inesperado en la página.', s: 'Exporta tu JSON de inmediato (si el botón responde), recarga con Ctrl+F5 e importa. Anota el código y el detalle y mándalos a soporte.' },
    E901: { c: 'Fallos inesperados de la página', n: 'e', d: 'Cualquier parte', m: 'Una operación en segundo plano falló.', s: 'Repite la acción. Si se repite, exporta tu JSON, recarga y avisa a soporte con el detalle.' },
    E902: { c: 'Fallos inesperados de la página', n: 'e', r: 1, d: 'Al abrir la página', m: 'No cargó una librería externa (gráficas, estilos o iconos), normalmente por internet o por un bloqueo.', s: 'Revisa tu internet, desactiva bloqueadores para este sitio y recarga con Ctrl+F5. Evita abrir la página desde el navegador de WhatsApp o del correo.' }
};
