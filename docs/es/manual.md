---
title: 'Manual – instalar y usar Copydeck en Adobe Illustrator'
description: 'Manual de Copydeck: instalación, vínculo con XML, CSV o TXT, comparación y actualización de variables de texto, vínculos y copia del arte.'
lang: es
ref: manual
order: 5
permalink: /es/manual/
---

# Manual de Copydeck

Copydeck vincula un archivo `.ai` con el archivo de datos de las variables (XML, CSV o TXT), muestra qué ha cambiado y actualiza los textos. La interfaz está disponible en español, inglés, italiano, francés y alemán: usa el menú de la parte superior derecha de la ventana.

## 1. Instalación

Copia `Copydeck.jsx` en la carpeta Scripts de Illustrator:

| Sistema | Carpeta |
| --- | --- |
| Windows | `C:\Program Files\Adobe\Adobe Illustrator <versión>\Presets\es_ES\Scripts\` |
| macOS | `/Applications/Adobe Illustrator <versión>/Presets.localized/es_ES/Scripts/` |

La carpeta del idioma depende de tu Illustrator (`es_ES`, `en_US`…). Reinicia Illustrator: el script aparece en **Archivo > Secuencias de comandos > Copydeck**. Sin instalarlo, usa **Archivo > Secuencias de comandos > Otra secuencia de comandos…** y elige el archivo.

### Atajo de teclado

Se recomienda un atajo, sobre todo para el método *Elegir en la mesa de trabajo*.

1. **Ventana > Acciones**. Crea un conjunto nuevo y después una acción nueva.
2. Como **Tecla de función** elige una tecla libre, por ejemplo Ctrl+Mayús+F12. No uses F5–F9: Illustrator ya las usa (F5 = Pinceles) y tienen prioridad.
3. Pulsa **Grabar**, luego en el menú del panel Acciones elige **Insertar elemento de menú…**, haz clic en **Archivo > Secuencias de comandos > Copydeck** y acepta. Detén la grabación.
4. Comprueba que la acción contiene el paso Copydeck: si falta, la tecla no hace nada.

Si después de reiniciar Illustrator la tecla deja de funcionar, el paso del script se ha perdido de la acción (ocurre): repite el punto 3.

## 2. Primer uso con un archivo

- Abre el archivo `.ai` y ejecuta el script.
- Pulsa **Elegir archivo de datos…** y elige el archivo de variables.
- El vínculo con el archivo de datos se guarda dentro del archivo `.ai`: las veces siguientes se carga solo. Si el archivo de datos se mueve, el script lo indica y basta con elegirlo de nuevo.
- Si el archivo contiene varios registros, elige el correcto en **Registro**.
- Cada vez que se abre, el script guarda automáticamente en las notas de los objetos los vínculos que aún no la tienen (consulta la [sección 6](#vinculos)). La barra de estado indica cuántos ha guardado.

### Archivos de datos compatibles

**XML** – el formato "biblioteca de variables" de Illustrator (*panel Variables > Guardar biblioteca de variables*). `<p>` = párrafo, `<br/>` = salto de línea forzado, `<b>` e `<i>` = negrita y cursiva (si la fuente tiene esos estilos).

**CSV o TXT delimitado por tabulaciones** – como en Illustrator y VariableImporter:

| Elemento | Significado |
| --- | --- |
| primera fila | nombres de las variables |
| otras filas | un registro por fila |
| `@nombre` | variable de imagen (se muestra, la gestiona Illustrator) |
| `#nombre` | variable de visibilidad (se muestra, la gestiona Illustrator) |
| `%nombre` | variable de gráfico (se muestra, la gestiona Illustrator) |
| salto de línea dentro de una celda, o `\\` | párrafo nuevo |

El separador (coma, punto y coma o tabulación) y la codificación (UTF-8, UTF-16 "Texto Unicode" de Excel, Windows-1252) se detectan automáticamente.

## 3. Leer la comparación

Pestaña **Variables y comparación**. Cada fila es una variable:

| Estado | Significado |
| --- | --- |
| ● Por actualizar | el texto del documento es distinto del archivo |
| ≈ Solo espacios/saltos de línea | solo cambian espacios o saltos de línea |
| ≈ Solo mayúsculas | solo cambian mayúsculas/minúsculas |
| ○ No vinculada | la variable existe pero ningún objeto la usa |
| + Nueva en el archivo | solo está en el archivo de datos: créala y vincúlala |
| ! No está en el archivo | está en el documento pero no en el archivo de datos |
| ✓ Actualizada | coincide con el archivo |

### Cómo compara

- Solo el texto. Negrita, cursiva, subrayado, colores y cualquier otro formato nunca cuentan.
- **Ignorar espacios y saltos de línea** (activada por defecto): las filas "≈ Solo espacios/saltos de línea" no están por actualizar y *Actualizar todas* las omite.
- **Ignorar mayúsculas** (desactivada por defecto): lo mismo para las filas "≈ Solo mayúsculas".
- Una fila "≈" se puede alinear igualmente con el archivo, de una en una, con **Igualar al archivo**.

### Uso de la lista

- **Mostrar** filtra por estado (también *Diferencias ignoradas*); **Buscar** busca en el nombre y en el texto. Varias palabras = deben aparecer todas.
- Haz clic en una fila: abajo ves el texto actual, el del archivo y la línea **Cambiará** con la parte que se va a modificar.
- La columna **Última actualización desde** indica desde qué archivo y cuándo se actualizó la variable por última vez con el script.
- Doble clic en una fila: Illustrator va al objeto y lo selecciona.

## 4. Actualizar

| Para actualizar | Haz esto |
| --- | --- |
| una variable | selecciona la fila > **Actualizar esta** |
| varias variables | Ctrl/Cmd+clic o Mayús+clic en las filas > **Actualizar las filas seleccionadas** |
| todas las variables | **Actualizar todas las variables pendientes** (solo las "● Por actualizar") |
| volver atrás | **Deshacer última actualización** |

### Cómo actualiza

- Solo cambian las palabras distintas: la negrita y los estilos del resto del texto se mantienen.
- Con *Ignorar espacios y saltos de línea* activado, tus saltos de línea y espacios manuales se quedan donde están. Ejemplo: documento "HARINA⏎de trigo (71 %)", archivo "HARINA de trigo (70 %)" → queda "HARINA⏎de trigo (70 %)".
- **Igualar al archivo** y los valores con `<b>`/`<i>` en el XML copian en cambio exactamente el texto del archivo, saltos de línea incluidos.
- Si una variable está vinculada a varios objetos, se actualizan todos.
- Los objetos bloqueados, o en capas bloqueadas u ocultas, se actualizan igualmente.

**Importante:** los cambios ya están en el documento. Guarda el archivo `.ai`.

## 5. Vincular una variable a un texto

### Automático: Emparejar automáticamente…

Disponible en la pestaña Variables y en la pestaña Objetos de texto. Propone en una lista:

- **Vincular** – objetos no vinculados cuyo texto coincide con el valor de una variable del archivo.
- **Copia adicional** – objetos con el mismo texto que una variable ya vinculada en otro sitio.
- **Restaurar** – objetos vinculados solo mediante sus notas (por ejemplo, después de pegarlos desde otro archivo): los vincula también en el panel Variables de Illustrator.

Solo están preseleccionadas las filas seguras. Las dudosas (mismo valor para varias variables, valores muy cortos, copias adicionales) aparecen en la lista pero sin seleccionar: la columna **Nota** explica por qué. Revisa, añade o quita filas con Ctrl/Cmd+clic y pulsa **Vincular selección**. Doble clic en una fila para ver el objeto.

### A mano

La ventana bloquea Illustrator mientras está abierta. Hay tres formas:

**A) Elegir en la mesa de trabajo** (la más cómoda): selecciona la variable > **Elegir en la mesa de trabajo…** > la ventana se cierra > haz clic en el texto en la mesa de trabajo > vuelve a ejecutar el script con el atajo. El vínculo se completa automáticamente y la ventana se vuelve a abrir en el mismo sitio.

**B) Seleccionar antes de abrir**: selecciona el texto en Illustrator > ejecuta el script > elige la variable > **Vincular a los objetos seleccionados**.

**C) Desde la lista** (pestaña **Objetos de texto**): los objetos de texto a la izquierda, las variables a la derecha, cada lista con su propia búsqueda.

1. Busca y elige el objeto (doble clic para verlo).
2. Busca y elige la variable.
3. Pulsa **Vincular objeto y variable**.

La ★ indica las parejas probables (texto del objeto igual al valor de la variable en el archivo); las filas con ★ van arriba. La lista de objetos muestra como máximo 200 filas: si hay más, escribe en la búsqueda para acotar.

### Otras acciones

- **Desvincular** – quita el vínculo (también la línea en las notas).
- **Crear variable** – para las filas "Nueva en el archivo".
- **Nueva variable a partir de este texto…** – en la pestaña Objetos de texto.
- **Eliminar variable** – la quita del documento (el texto se queda).

## 6. Cómo se guardan los vínculos {#vinculos}

Un objeto puede estar vinculado de dos maneras, y el script lee las dos:

- **Vínculo de Illustrator** – el del panel Variables. Una variable solo tiene uno; no sigue al objeto si lo copias a otro archivo.
- **La línea `VAR:nombrevariable` en las notas del objeto** (panel Atributos) – la escribe el script y viaja con el objeto cuando lo copias. No la borres ni la modifiques a mano.

Si un objeto tiene las dos e indican variables distintas, prevalece el vínculo de Illustrator.

La línea se escribe en las notas:

- cuando vinculas un objeto con el script;
- cada vez que se abre el script, para los vínculos que aún no la tienen (creados en el panel Variables o con versiones anteriores);
- para la misma variable en varios objetos: el primero usa el vínculo de Illustrator, los demás solo la línea en las notas.

### Copiar el arte

**Dentro del mismo archivo**: la copia sigue vinculada a la misma variable y se actualiza junto con el original. Si una copia ya no debe seguir la variable, selecciónala y pulsa **Desvincular**.

**A otro archivo**:

1. En el archivo de origen abre el script (guarda las notas que faltan), ciérralo y guarda el archivo `.ai`.
2. Copia y pega el arte en el archivo nuevo.
3. En el archivo nuevo abre el script: los objetos ya están vinculados. Elige el archivo de datos y pulsa **Emparejar automáticamente…**: las filas *Restaurar* vuelven a crear los vínculos también en el panel Variables.

### Opciones

En la pestaña Objetos de texto, abajo a la derecha:

- **Vincular también en el panel Variables** – si se desactiva, los vínculos nuevos están solo en las notas. El script funciona igual, pero el panel Variables de Illustrator no los ve.
- **Guardar en las notas (para copiar)** – si se desactiva, el script deja de escribir notas, tanto en los vínculos nuevos como al abrirse; las ya escritas se mantienen.

## 7. Conviene saber

| Qué | Dónde se guarda |
| --- | --- |
| vínculo con el archivo de datos, historial | dentro del archivo `.ai` (metadatos XMP) |
| vínculos de los objetos | panel Variables y notas de los objetos |
| opciones e idioma | preferencias de Illustrator en este ordenador |

- En el panel Variables de Illustrator el conjunto de datos puede aparecer como "modificado": es normal, el script escribe directamente en los textos.
- Si Illustrator queda ocupado un rato al cerrar el script, después de muchos vínculos, prueba a cerrar el panel Variables antes de usar el script. Si no basta, desactiva *Vincular también en el panel Variables*.
- Si aparece un error, anota el mensaje y el número de línea y [abre una incidencia en GitHub]({{ site.repository_url }}/issues).
