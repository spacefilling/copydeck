---
title: 'Actualizar las variables de texto de Illustrator desde XML, CSV y TXT'
description: 'Script gratuito para Adobe Illustrator: compara las variables de texto con un copy deck en XML, CSV o TXT y actualízalas sin perder el formato.'
lang: es
ref: home
order: 5
permalink: /es/
image: /assets/social-preview.png
faq:
  - q: '¿Cómo actualizo las variables de texto de Illustrator desde un archivo CSV o XML?'
    a: 'Ejecuta Copydeck, elige el archivo de datos y abre la pestaña "Variables y comparación". Cada variable cuyo texto es distinto del archivo aparece como "Por actualizar". Puedes actualizarlas una a una o todas juntas; solo se sustituyen las palabras que han cambiado.'
  - q: '¿Copydeck funciona con el panel Variables y los conjuntos de datos de Illustrator?'
    a: 'Sí. Copydeck lee y escribe las mismas variables que ves en el panel Variables y carga la biblioteca de variables XML que guarda Illustrator. Además ofrece una comparación clara y actualizaciones más seguras.'
  - q: '¿Una variable puede vincularse a varios objetos de texto?'
    a: 'Sí. El primer objeto usa el vínculo de Illustrator; los demás los vincula Copydeck mediante la línea "VAR:nombre" en las notas del objeto. Todos se actualizan juntos.'
  - q: '¿Actualizar una variable borra negritas, colores o saltos de línea manuales?'
    a: 'No. Copydeck solo sustituye las palabras distintas, así que el formato del resto del texto se mantiene. Con "Ignorar espacios y saltos de línea" activado, tus saltos de línea manuales también se quedan en su sitio.'
  - q: '¿Qué formato CSV lee Copydeck?'
    a: 'El mismo que la combinación de datos de Illustrator. La primera fila contiene los nombres de las variables y cada fila siguiente es un registro. Las columnas que empiezan por @, # o % son variables de imagen, visibilidad y gráfico. Los separadores (coma, punto y coma, tabulación) y las codificaciones (UTF-8, UTF-16, Windows-1252) se detectan automáticamente.'
  - q: '¿Con qué versiones de Illustrator funciona?'
    a: 'Copydeck es un script ExtendScript (.jsx) y funciona con Illustrator para Windows y macOS con soporte de scripts. Se escribió para Illustrator 2025; los comentarios sobre otras versiones son bienvenidos en GitHub.'
  - q: '¿Copydeck es gratuito?'
    a: 'Sí. Copydeck es gratuito y de código abierto, con licencia GNU GPL v3. Puedes usarlo en cualquier trabajo, también remunerado; las versiones modificadas solo pueden distribuirse con la misma licencia y con su código fuente.'
---

# Copydeck para Adobe Illustrator

<p class="lead">Mantén el arte de Illustrator sincronizado con su copy deck. Compara las variables de texto con un archivo XML, CSV o TXT, mira exactamente qué ha cambiado y actualiza los textos sin perder el formato.</p>

{% include download.html %}

![Copydeck: comparar y actualizar las variables de texto de Adobe Illustrator desde un archivo de datos]({{ '/assets/social-preview.png' | relative_url }})

## ¿Qué es Copydeck?

El *copy deck* es el documento que reúne todos los textos de un envase, una etiqueta o una campaña: nombre del producto, ingredientes, tabla nutricional, alérgenos, textos legales, declaraciones. Copydeck vincula ese documento, guardado como XML, CSV o TXT, con tu arte de Illustrator mediante las **variables de Illustrator**, y te dice qué textos de la mesa de trabajo no están actualizados.

El panel Variables y la combinación de datos de Illustrator importan los datos, pero no muestran qué ha cambiado, vinculan cada variable a un solo objeto y, al aplicar un conjunto de datos, reescriben todo el texto y su formato. Copydeck usa las mismas variables de Illustrator y les añade una forma de trabajar clara y segura.

## Funciones

- **Vista de comparación**: el estado de cada variable (por actualizar, actualizada, no vinculada, nueva en el archivo, no está en el archivo), el texto del documento, el del archivo y la parte exacta que va a cambiar.
- **Actualizaciones que respetan el formato**: solo se sustituyen las palabras distintas. Negritas, colores, estilos de carácter y, si quieres, espacios y saltos de línea manuales se mantienen.
- **Ignora lo que no importa**: las diferencias de espacios y saltos de línea (y, opcionalmente, de mayúsculas) no cuentan como cambios. El formato nunca cuenta.
- **Actualiza una, varias o todas las variables**, con deshacer de la última actualización.
- **Recuerda el origen**: el archivo de datos vinculado y, para cada variable, el archivo y el registro de su última actualización se guardan dentro del archivo `.ai`.
- **Herramientas de vinculación**: listas de objetos de texto y variables con búsqueda, elección en la mesa de trabajo, vinculación de la selección, creación de una variable a partir de un texto.
- **Emparejamiento automático**: propone vincular los objetos cuyo texto ya coincide con el valor de una variable; los casos dudosos aparecen en la lista pero no preseleccionados.
- **Una variable en varios objetos**, y vínculos que se mantienen al copiar y pegar en otro documento.
- **XML, CSV y TXT** en los formatos que usan Illustrator y VariableImporter.
- **Interfaz en español, inglés, italiano, francés y alemán.**

## ¿Para quién es?

- **Diseñadores de envases y etiquetas** que actualizan ingredientes, información nutricional, alérgenos, pesos netos y textos legales en muchas referencias.
- **Agencias y estudios** que reciben el copy deck del cliente y deben comprobar cada texto en el arte.
- **Catálogos, listas de precios y gráficos basados en datos** hechos con la combinación de datos de Illustrator.
- **Envases multilingües**, con un registro por idioma o mercado.

## Cómo funciona

1. Abre tu archivo `.ai` y ejecuta **Copydeck** (Archivo > Secuencias de comandos > Copydeck).
2. Pulsa **Elegir archivo de datos…** y elige tu XML, CSV o TXT. El vínculo se guarda en el archivo `.ai`.
3. Revisa las filas **● Por actualizar**: debajo ves el texto actual, el nuevo y qué va a cambiar.
4. Pulsa **Actualizar esta** o **Actualizar todas las variables pendientes** y guarda el archivo `.ai`.

Las variables nuevas se vinculan con **Emparejar automáticamente…**, eligiendo el objeto en la mesa de trabajo o desde la pestaña **Objetos de texto**. Todas las opciones están en el [manual]({{ '/es/manual/' | relative_url }}).

## Copydeck y el panel Variables de Illustrator

| | Panel Variables de Illustrator | Copydeck |
| --- | --- | --- |
| Ver qué textos son distintos de los datos | No | Sí, con el cambio exacto |
| Actualizar una sola variable | Solo cambiando de conjunto de datos | Sí |
| Mantener el formato de las palabras sin cambios | No | Sí |
| Ignorar diferencias de espacios y saltos de línea | No | Sí |
| Una variable en varios objetos | No | Sí |
| Recordar el archivo de origen y el historial | No | Sí, dentro del archivo `.ai` |
| Mantener los vínculos al copiar el arte a otro archivo | No | Sí, mediante las notas del objeto |

## Archivos de datos

**XML**: la biblioteca de variables que Illustrator guarda desde el panel Variables. `<p>` se convierte en párrafo, `<br/>` en salto de línea forzado, `<b>` e `<i>` en negrita y cursiva.

**CSV y TXT**: la primera fila contiene los nombres de las variables y cada fila siguiente es un registro.

```csv
product_name,net_weight,ingredients,@photo,#show_badge
Tomato soup,500 g,"Tomatoes 85%, water, olive oil, salt",/images/tomato.jpg,TRUE
Pea soup,400 g,"Peas 70%, water, CELERY, salt",/images/pea.jpg,FALSE
```

Hay archivos de ejemplo en la [carpeta examples de GitHub]({{ site.repository_url }}/tree/main/examples).

## Instalación

Descarga `Copydeck.jsx` y cópialo en la carpeta Scripts de Illustrator (`Presets/<idioma>/Scripts`); después reinicia Illustrator. También puedes ejecutarlo una vez con **Archivo > Secuencias de comandos > Otra secuencia de comandos…**. El [manual]({{ '/es/manual/' | relative_url }}) explica cómo asignarle un atajo de teclado.

{% include faq.html %}
