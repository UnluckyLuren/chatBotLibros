// script.js
document.addEventListener("DOMContentLoaded", async () => {
    //  Modelos y Datos 
    let nluModel = null;
    let sentenceEncoder = null;
    const { libros, autores } = BCLibrosSCIFI;
    
    // Este mapeo DEBE ser idéntico al de tu script de entrenamiento
    const INTENTIONS = [
      'saludar',
      'buscar_sinopsis',
      'buscar_autor',
      'libros_por_autor',
      'libros_por_tema'
    ];

    //  Elementos del DOM 
    const chatWindow = document.getElementById("chat-window");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const loadingStatus = document.getElementById("loading-status");

    //  Cargar Modelos 
    async function loadModels() {
        try {
            // Cargar nuestro modelo de NLU (Clasificador de Intención)
            console.log("Cargando modelo...");
            nluModel = await tf.loadLayersModel('./model/model.json');
            
            // Cargar el codificador de frases (Universal Sentence Encoder)
            console.log("Cargando Sentence Encoder...");
            sentenceEncoder = await use.load();
            
            console.log("¡Modelos cargados! El bot está listo.");
            loadingStatus.textContent = "¡Hola! Soy Rubble bot tu asistente IA. Pregúntame sobre Sci-Fi.";
            loadingStatus.className = "bot-message";
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();

        } catch (error) {
            console.error("Error al cargar los modelos:", error);
            loadingStatus.textContent = "Error al cargar los modelos de IA. Intenta recargar la página.";
            loadingStatus.style.backgroundColor = "#ffcccc";
        }
    }
    
    // Iniciar la carga de modelos
    loadModels();

    //  Manejo de Eventos 
    userInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter" && !userInput.disabled) {
            handleUserInput();
        }
    });

    sendBtn.addEventListener("click", () => {
        if (!userInput.disabled) {
            handleUserInput();
        }
    });

    async function handleUserInput() {
        const query = userInput.value.trim();
        if (query === "") return;

        displayMessage(query, "user");
        userInput.value = "";
        userInput.disabled = true; // Desactivar mientras el bot "piensa"

        // Predecir la intención
        const intent = await predictIntent(query);
        
        // Extraer entidades (forma simple)
        const entity = extractEntity(query, intent);
        
        // Obtener respuesta
        const response = getBotResponse(intent, entity, query);

        // Simular un pequeño retraso para la respuesta del bot
        setTimeout(() => {
            displayMessage(response, "bot");
            userInput.disabled = false; // Reactivar
            userInput.focus();
        }, 100);
    }

    function displayMessage(message, sender) {
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${sender}`;

    if (sender === "bot") {
        const avatar = document.createElement("img");
        avatar.src = "./assets/img/rubble.png";
        avatar.className = "avatar-bot";
        wrapper.appendChild(avatar);
    }

    const msg = document.createElement("div");
    msg.className = `${sender}-message`;
    msg.textContent = message;

    wrapper.appendChild(msg);
    chatWindow.appendChild(wrapper);

    chatWindow.scrollTop = chatWindow.scrollHeight;
}



    //  NÚCLEO DE TENSORFLOW.JS 

    async function predictIntent(query) {
        if (!nluModel || !sentenceEncoder) {
            return "error";
        }

        const lowerQuery = query.toLowerCase();
        
        // 1. Convertir la frase del usuario en un vector (Tensor)
        const embedding = await sentenceEncoder.embed([lowerQuery]);
        
        // 2. Usar nuestro modelo para predecir
        const prediction = nluModel.predict(embedding);
        
        // 3. Obtener la intención con la probabilidad más alta
        const intentIndex = (await prediction.argMax(1).data())[0];
        
        // Limpieza de memoria
        embedding.dispose();
        prediction.dispose();
        
        return INTENTIONS[intentIndex];
    }
    
    //  LÓGICA DEL BOT (Igual que antes, pero usando la 'intención') 

    function getBotResponse(intent, entity, originalQuery) {
        console.log(`Intención: ${intent}, Entidad: ${entity}`);
        
        switch (intent) {
            case 'saludar':
                return "¡Hola! ¿Sobre qué libro de ciencia ficción quieres saber?";
            
            case 'buscar_sinopsis':
                if (!entity) return `No reconocí un libro en tu pregunta. ¿De qué libro quieres la sinopsis?`;
                return getSynopsis(entity);
                
            case 'buscar_autor':
                if (!entity) return `No reconocí un libro en tu pregunta. ¿De qué libro quieres saber el autor?`;
                return getAuthor(entity);

            case 'libros_por_autor':
                if (!entity) return `No reconocí un autor en tu pregunta. ¿De qué autor quieres ver sus libros?`;
                return getBooksByAuthor(entity);
            
            case 'libros_por_tema':
                 if (!entity) return `No reconocí un tema en tu pregunta. ¿Sobre qué tema buscas libros?`;
                return getBooksByTheme(entity);

            default:
                return "Lo siento, no entendí esa pregunta. Intenta reformularla.";
        }
    }

    //  Extracción de Entidades (Simple) 
    // En un sistema real, esto también usaría un modelo de IA (NER)
    // Aquí, solo buscamos coincidencias en la base de datos.
    
    function extractEntity(query, intent) {
        const lowerQuery = query.toLowerCase();

        if (intent === 'buscar_sinopsis' || intent === 'buscar_autor') {
            // Buscar un título de libro
            const foundBook = libros.find(libro => lowerQuery.includes(libro.titulo.toLowerCase()));
            return foundBook ? foundBook.titulo : null;
        }
        
        if (intent === 'libros_por_autor') {
             // Buscar un nombre de autor
            const foundAuthor = autores.find(autor => lowerQuery.includes(autor.nombre.toLowerCase().split(' ')[0])); // Busca por apellido
            return foundAuthor ? foundAuthor.nombre : null;
        }

        if (intent === 'libros_por_tema') {
            // Esto es más difícil. Buscamos palabras clave de temas/subgéneros.
            const allThemes = new Set(libros.flatMap(l => [...l.subgenero, ...l.temas]).map(t => t.toLowerCase()));
            for (const theme of allThemes) {
                if (lowerQuery.includes(theme)) {
                    return theme;
                }
            }
            return null; // No se encontró un tema conocido
        }
        
        return null;
    }

    //  Funciones de Búsqueda (Idénticas al bot de reglas) 

    function getSynopsis(title) {
        const book = libros.find(l => l.titulo.toLowerCase() === title.toLowerCase());
        return book 
            ? `Sinopsis de "${book.titulo}": ${book.sinopsis}`
            : `No pude encontrar el libro "${title}".`;
    }

    function getAuthor(title) {
        const book = libros.find(l => l.titulo.toLowerCase() === title.toLowerCase());
        return book
            ? `"${book.titulo}" fue escrito por ${book.autor}.`
            : `No pude encontrar el libro "${title}".`;
    }

    function getBooksByAuthor(authorName) {
        const foundBooks = libros.filter(libro => libro.autor.toLowerCase() === authorName.toLowerCase());
        if (foundBooks.length === 0) return `No encontré libros de "${authorName}".`;
        const titles = foundBooks.map(libro => libro.titulo).join(", ");
        return `Libros de ${authorName} en la base de datos: ${titles}.`;
    }

    function getBooksByTheme(theme) {
        const foundBooks = libros.filter(libro => 
            (libro.subgenero && libro.subgenero.some(s => s.toLowerCase().includes(theme))) ||
            (libro.temas && libro.temas.some(t => t.toLowerCase().includes(theme)))
        );
        if (foundBooks.length === 0) return `No encontré libros sobre "${theme}".`;
        const titles = foundBooks.map(libro => libro.titulo).join(", ");
        return `Libros relacionados con "${theme}": ${titles}.`;
    }
});

// Para el menu aside

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const pantallaAncho = window.screen.width;


    // Función para alternar el menú
    function toggleMenu() {

        if (pantallaAncho <= 800) {
            sidebar.classList.toggle('active');     
            sidebar.classList.remove('collapsed');       
        } else {
            sidebar.classList.toggle('collapsed');
            sidebar.classList.remove('active');   
        }

    }
    
    menuBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);
});

// Para el boton de nuevo chat

const btNuevoChatsito = document.getElementById('btNuevoChatsito');

btNuevoChatsito.addEventListener('click', () => {
    location.reload();
});

// Para los comandos

const misComandos = document.querySelectorAll('.history-list li');
const sideCont = document.getElementById('sideCont');
const inputEscribir = document.getElementById('user-input');

sideCont.addEventListener('click', e => {
    if (e.target.tagName === 'LI') {
        inputEscribir.value = e.target.textContent;
    }
});


