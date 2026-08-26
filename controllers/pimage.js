const sharp = require('sharp');
const { Ollama } = require('ollama');

// ============================================================================
// ⚙️ CONFIGURACIÓN DE PARÁMETROS MODIFICABLES
// ============================================================================
const CONFIG = {
  // 1. Red y Servidor Ollama (Cambia la IP según tu red si no usas variables de entorno)
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://192.168.1.185:11434',
  MODEL_NAME: process.env.OLLAMA_MODEL || 'llama3.2-vision:latest', // minicpm-v o llama3.2-vision

  // 2. Preprocesamiento de Imagen (Sharp)
  IMAGE_MAX_WIDTH: 1200, // Ancho máximo al escalar
  IMAGE_QUALITY: 90,     // Calidad del JPEG (1 - 100)

  // 3. Metadatos y Esquema Base
  DEFAULT_METADATA: {
    titulo: "Tabla de Resultados Extraída por Ollama Vision",
    mesurando: "Frecuencia / Magnitud eléctrica",
    unit: "Hz, kHz, %L",
    range: "",
    ecuation_calibration: ""
  }
};
// ============================================================================

// Instancia del cliente oficial de Ollama
const ollama = new Ollama({ host: CONFIG.OLLAMA_HOST });

async function preprocesarImagen(imageBuffer) {
  return await sharp(imageBuffer)
    .resize({ width: CONFIG.IMAGE_MAX_WIDTH, fit: 'inside' })
    .jpeg({ quality: CONFIG.IMAGE_QUALITY })
    .toBuffer();
}

async function procesarTabla(req, res) {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ ok: false, message: 'Falta la propiedad imageBase64.' });
    }

    // 1. Limpieza y preprocesamiento con Sharp
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '').trim();
    const rawBuffer = Buffer.from(cleanBase64, 'base64');
    const processedBuffer = await preprocesarImagen(rawBuffer);

    // Convertir el buffer optimizado a base64 para el payload de Ollama
    const finalBase64Image = processedBuffer.toString('base64');

    console.log(`Enviando imagen al contenedor de Ollama en: ${CONFIG.OLLAMA_HOST} (Modelo: ${CONFIG.MODEL_NAME})`);

    // 2. Definición del Prompt con Few-Shot / Esquema estricto
    const esquemaEjemplo = {
      ...CONFIG.DEFAULT_METADATA,
      columnas: [
        { key: "intervalo", label: "Intervalo", unit: "", type: "string" },
        { key: "valor_referencia", label: "Valor de Referencia", unit: "Hz", type: "number" }
      ],
      filas: [
        {
          valor_referencia: 9.999789,
          resultado: 10.00020,
          valor_medido: 0.00041,
          incertidumbre: "±0,000 28"
        }
      ]
    };

    const prompt = `Analiza detalladamente la tabla de calibración presente en la imagen.
Extrae todos sus datos numéricos y de texto, y devuélvelos ÚNICAMENTE en una estructura JSON idéntica a esta:

${JSON.stringify(esquemaEjemplo, null, 2)}

REGLAS STRICTAS:
- Devuelve SOLO el objeto JSON sin bloques de código Markdown (no agregues \`\`\`json) ni texto explicativo.
- Mantén la precisión exacta de los decimales presentes en la tabla.
- Extrae todas las filas y mapea las columnas adecuadamente.`;

    // 3. Consulta al contenedor Ollama
    const response = await ollama.chat({
      model: CONFIG.MODEL_NAME,
      messages: [{
        role: 'user',
        content: prompt,
        images: [finalBase64Image]
      }],
      options: {
        temperature: 0.0 // Evita alucinaciones numéricas
      }
    });

    const rawOutput = response.message.content.trim();
    console.log('\n================ RESPUESTA RAW DE OLLAMA ================');
    console.log(rawOutput);

    // 4. Limpieza del string y parseo a JSON
    let jsonFinal;
    try {
      const jsonLimpio = rawOutput.replace(/```json|```/g, '').trim();
      jsonFinal = JSON.parse(jsonLimpio);
    } catch (parseErr) {
      console.warn('⚠️ No se pudo parsear como JSON directo, enviando respuesta raw.');
      jsonFinal = { raw_response: rawOutput };
    }

    console.log('\n================ JSON FINAL PARSEADO ================');
    console.log(JSON.stringify(jsonFinal, null, 2));
    console.log('=======================================================\n');

    return res.json({
      ok: true,
      data: jsonFinal
    });

  } catch (error) {
    console.error('❌ Error al procesar con Ollama:', error.message);
    return res.status(500).json({
      ok: false,
      message: error.message || 'Error interno al comunicarse con el servidor Ollama.'
    });
  }
}

module.exports = { procesarTabla };