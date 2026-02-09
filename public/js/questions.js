/**
 * Banco de Preguntas - EdTech Mastery LAN
 * Diagnóstico de Competencias Digitales Docentes
 * 23 preguntas organizadas en 4 categorías
 */

const questionsBank = [
    // ========================================
    // Categoría: Pedagogía Digital (5 preguntas)
    // ========================================
    {
        id: 1,
        category: "Pedagogía Digital",
        difficulty: "básico",
        question: "¿Qué significa el acrónimo TPACK en el contexto de la tecnología educativa?",
        context: "Este marco es fundamental para comprender cómo integrar la tecnología en la enseñanza de manera efectiva.",
        options: [
            "Teaching, Planning, Assessment, Curriculum and Knowledge",
            "Technological Pedagogical Content Knowledge",
            "Technology, Practice, Analysis, Collaboration and Knowledge",
            "Teaching Process for Advanced Classroom Knowledge"
        ],
        correctIndex: 1,
        explanation: "TPACK (Technological Pedagogical Content Knowledge) es un marco que describe los tipos de conocimiento que necesitan los docentes para integrar efectivamente la tecnología en su enseñanza, combinando conocimiento tecnológico, pedagógico y de contenido."
    },
    {
        id: 2,
        category: "Pedagogía Digital",
        difficulty: "intermedio",
        question: "Según el modelo SAMR, ¿en qué nivel se clasifica el uso de Google Docs para que los estudiantes entreguen sus tareas digitalmente en lugar de en papel?",
        context: "El modelo SAMR ayuda a clasificar cómo la tecnología transforma la experiencia de aprendizaje.",
        options: [
            "Augmentation (Augmentación)",
            "Modification (Modificación)",
            "Redefinition (Redefinición)",
            "Substitution (Sustitución)"
        ],
        correctIndex: 3,
        explanation: "Entregar tareas digitalmente es una Sustitución ya que la tecnología actúa como sustituto directo sin cambio funcional. Para alcanzar niveles superiores, la tecnología debería permitir tareas antes impossibles como la colaboración simultánea en tiempo real."
    },
    {
        id: 3,
        category: "Pedagogía Digital",
        difficulty: "intermedio",
        question: "En el marco TPACK, ¿qué representa el conocimiento de contenido tecnológico (TCK)?",
        context: "Este conocimiento se refiere a cómo la tecnología transforma la manera en que presentamos y conceptualizamos los contenidos.",
        options: [
            "Saber usar herramientas tecnológicas básicas",
            "Comprender cómo el contenido puede ser representado y transformado mediante la tecnología",
            "Conocer los programas educativos específicos de cada materia",
            "Dominio de la programación para enseñar programación"
        ],
        correctIndex: 1,
        explanation: "El TCK es el conocimiento sobre cómo la tecnología puede transformar la representación y comprensión del contenido disciplinar, incluyendo conocer las affordances y limitaciones de la tecnología para enseñar conceptos específicos."
    },
    {
        id: 4,
        category: "Pedagogía Digital",
        difficulty: "avanzado",
        question: "Una maestra usa realidad aumentada para que los estudiantes exploren el interior de una célula en 3D mientras aprenden biología. ¿Cómo se clasifica esto en el modelo SAMR?",
        context: "La realidad aumentada crea experiencias de aprendizaje completamente nuevas.",
        options: [
            "Substitution - Los estudiantes observan modelos 3D en lugar de imágenes estáticas",
            "Augmentation - La tecnología mejora una tarea existente con mejora funcional",
            "Modification - La tecnología permite tareas significativamente diferentes",
            "Redefinition - La tecnología permite crear nuevas tareas previamente impensables"
        ],
        correctIndex: 3,
        explanation: "El uso de realidad aumentada para explorar el interior de una célula es Redefinición porque permite a los estudiantes experimentar y manipular estructuras biológicas de maneras que serían impossibles sin la tecnología."
    },
    {
        id: 5,
        category: "Pedagogía Digital",
        difficulty: "básico",
        question: "¿Cuál de las siguientes es una característica del modelo pedagógico constructivista en entornos digitales?",
        context: "El constructivismo es uno de los pilares fundamentales de la educación moderna.",
        options: [
            "El docente transmite conocimientos de forma unidireccional",
            "El aprendizaje ocurre mediante la construcción activa del conocimiento por parte del estudiante",
            "El uso de tecnología debe ser supervisado constantemente sin autonomía",
            "Los contenidos digitales deben ser lineales y secuenciales"
        ],
        correctIndex: 1,
        explanation: "El constructivismo postula que el aprendizaje es un proceso activo donde el estudiante construye su propio conocimiento a través de experiencias. En entornos digitales, esto se traduce en herramientas que permiten la exploración y construcción colaborativa."
    },

    // ========================================
    // Categoría: Competencias Digitales Docentes (5 preguntas)
    // ========================================
    {
        id: 6,
        category: "Competencias Digitales Docentes",
        difficulty: "intermedio",
        question: "Según el marco DigCompEdu, ¿qué nivel de competencia digital representa un docente que puede proteger los datos personales de los estudiantes y gestionar el acceso a contenidos digitales?",
        context: "DigCompEdu establece seis niveles de competencia digital docente.",
        options: [
            "A1 - Nuevo usuario (Newcomer)",
            "A2 - Explorador (Explorer)",
            "B1 - Integrador (Integrator)",
            "B2 - Experto (Expert)"
        ],
        correctIndex: 2,
        explanation: "El nivel B1 (Integrador) implica que el docente puede utilizar la tecnología de manera reflexiva para la enseñanza, incluyendo la protección de datos y gestión de contenidos de forma autónoma."
    },
    {
        id: 7,
        category: "Competencias Digitales Docentes",
        difficulty: "básico",
        question: "¿Qué significa el concepto de 'huella digital' en el contexto de la profesión docente?",
        context: "La presencia digital docente es cada vez más relevante en la profesión moderna.",
        options: [
            "El registro de calificaciones de los estudiantes en sistemas digitales",
            "La información que dejamos en internet sobre nuestra identidad profesional",
            "El historial de publicaciones académicas de un profesor",
            "Las contraseñas utilizadas para acceder a plataformas educativas"
        ],
        correctIndex: 1,
        explanation: "La huella digital se refiere a toda la información que dejamos en internet sobre nuestra identidad y actividad profesional. Para los docentes, esto incluye publicaciones, interacciones en redes sociales y contenido educativo compartido."
    },
    {
        id: 8,
        category: "Competencias Digitales Docentes",
        difficulty: "intermedio",
        question: "En el contexto de derechos de autor y educación, ¿qué son los Recursos Educativos Abiertos (REA)?",
        context: "Los REA son fundamentales para el acceso equitativo a la educación.",
        options: [
            "Materiales educativos que solo pueden ser usados en instituciones públicas",
            "Recursos educativos disponibles en internet sin restricciones de uso",
            "Materiales que se pueden descargar pero no modificar ni compartir",
            "Recursos producidos exclusivamente por el gobierno"
        ],
        correctIndex: 1,
        explanation: "Los Recursos Educativos Abiertos (REA) son materiales de enseñanza, aprendizaje e investigación que están en dominio público o han sido publicados con licencias abiertas que permiten su uso, modificación y compartición gratuitos."
    },
    {
        id: 9,
        category: "Competencias Digitales Docentes",
        difficulty: "avanzado",
        question: "Según DigCompEdu, ¿cuál es la dimensión asociada con la evaluación formativa habilitada por tecnologías digitales?",
        context: "La evaluación es uno de los pilares del proceso educativo.",
        options: [
            "Empoderamiento de los estudiantes",
            "Evaluación (Assessment)",
            "Facilitación de la colaboración",
            "Autorreflexión del docente"
        ],
        correctIndex: 1,
        explanation: "En DigCompEdu, la dimensión 3 'Evaluación' específicamente aborda cómo la tecnología puede usarse para proporcionar retroalimentación oportuna, realizar evaluaciones formativas y sumativas, y analizar datos de aprendizaje."
    },
    {
        id: 10,
        category: "Competencias Digitales Docentes",
        difficulty: "básico",
        question: "¿Qué práctica NO es recomendada para mantener la seguridad digital del docente?",
        context: "La seguridad digital es parte esencial de la competencia docente.",
        options: [
            "Usar diferentes contraseñas robustas para cada plataforma educativa",
            "Habilitar autenticación de dos factores cuando esté disponible",
            "Compartir credenciales de acceso con colegas de confianza",
            "Mantener actualizados los sistemas operativos y aplicaciones"
        ],
        correctIndex: 2,
        explanation: "Compartir credenciales de acceso viola los protocolos de seguridad y puede comprometer la confidencialidad de datos estudiantiles. Las otras opciones son prácticas recomendadas de ciberseguridad."
    },

    // ========================================
    // Categoría: Herramientas Tecnológicas (5 preguntas)
    // ========================================
    {
        id: 11,
        category: "Herramientas Tecnológicas",
        difficulty: "básico",
        question: "¿Cuál de las siguientes plataformas es un Sistema de Gestión de Aprendizaje (LMS) ampliamente utilizado en instituciones educativas?",
        context: "Los LMS son fundamentales para la educación moderna.",
        options: [
            "Zoom",
            "Moodle",
            "Canva",
            "Discord"
        ],
        correctIndex: 1,
        explanation: "Moodle (Modular Object-Oriented Dynamic Learning Environment) es un sistema de gestión de aprendizaje de código abierto ampliamente utilizado en instituciones educativas de todo el mundo."
    },
    {
        id: 12,
        category: "Herramientas Tecnológicas",
        difficulty: "intermedio",
        question: "¿Qué herramienta es más adecuada para realizar evaluaciones formativas en tiempo real con retroalimentación inmediata durante una clase?",
        context: "La retroalimentación inmediata mejora el aprendizaje.",
        options: [
            "Google Drive",
            "Kahoot o Mentimeter",
            "Microsoft Word",
            "Adobe Acrobat"
        ],
        correctIndex: 1,
        explanation: "Kahoot y Mentimeter son plataformas de evaluación gamificada que permiten crear cuestionarios y encuestas para obtener retroalimentación inmediata de los estudiantes durante la clase, fomentando la participación activa."
    },
    {
        id: 13,
        category: "Herramientas Tecnológicas",
        difficulty: "intermedio",
        question: "Un docente desea crear un video tutorial con narración para sus estudiantes. ¿Qué herramienta de las siguientes es más apropiada para este propósito?",
        context: "La creación de contenido multimedia es una competencia docente importante.",
        options: [
            "Excel",
            "PowerPoint",
            "OBS Studio o Canvas Record",
            "WinRAR"
        ],
        correctIndex: 2,
        explanation: "OBS Studio (Open Broadcaster Software) y Canvas Record son herramientas que permiten grabar la pantalla del computador junto con audio y webcam, siendo ideales para crear video tutoriales educativos de manera gratuita."
    },
    {
        id: 14,
        category: "Herramientas Tecnológicas",
        difficulty: "avanzado",
        question: "¿Cuál es la principal ventaja de usar herramientas de mensajería educativa como ClassDojo sobre el correo electrónico tradicional para comunicación con familias?",
        context: "La comunicación efectiva con familias es clave para el éxito estudiantil.",
        options: [
            "Es completamente anónimo",
            "Permite comunicación bidireccional más inmediata y puede incluir multimedia como fotos y videos",
            "Solo funciona en horario escolar",
            "No requiere conexión a internet"
        ],
        correctIndex: 1,
        explanation: "Las herramientas de mensajería educativa permiten comunicación más inmediata y fluida con las familias, incluyendo el envío de fotografías, videos y actualizaciones en tiempo real sobre el comportamiento y progreso de los estudiantes."
    },
    {
        id: 15,
        category: "Herramientas Tecnológicas",
        difficulty: "intermedio",
        question: "Según tendencias actuales, ¿qué característica define al 'microlearning' como estrategia de enseñanza?",
        context: "El aprendizaje en bloques cortos es cada vez más popular.",
        options: [
            "Clases magistrales de 2 horas",
            "Contenido fragmentado en unidades pequeñas y específicas de 3-10 minutos",
            "Exclusivamente aprendizaje autodirigido sin estructura",
            "Solo disponible para dispositivos móviles"
        ],
        correctIndex: 1,
        explanation: "El microlearning consiste en organizar el contenido educativo en unidades breves y focalizadas (típicamente de 3 a 10 minutos), facilitando el aprendizaje en momentos disponibles y mejorando la retención."
    },

    // ========================================
    // Categoría: Tendencias Actuales (8 preguntas)
    // ========================================
    {
        id: 16,
        category: "Tendencias Actuales",
        difficulty: "básico",
        question: "¿Cómo se define el 'aprendizaje híbrido' (blended learning) en el contexto educativo actual?",
        context: "El aprendizaje híbrido se ha vuelto fundamental post-pandemia.",
        options: [
            "Exclusivamente educación en línea sin contacto presencial",
            "Combinación deliberada de experiencias de aprendizaje presenciales y en línea",
            "Uso de tecnología únicamente para tareas administrativas",
            "Un método de enseñanza donde solo se usan tabletas"
        ],
        correctIndex: 1,
        explanation: "El aprendizaje híbrido es un modelo educativo que integra de manera intencional y estratégica componentes de enseñanza presencial y en línea, aprovechando las fortalezas de cada modalidad."
    },
    {
        id: 17,
        category: "Tendencias Actuales",
        difficulty: "intermedio",
        question: "¿Cuál de las siguientes es una aplicación ética y pedagógica de la Inteligencia Artificial en educación?",
        context: "La IA ofrece oportunidades pero también desafíos éticos.",
        options: [
            "Sustituir completamente al docente sin supervisión humana",
            "Generar contenido educativo personalizado y proporcionar retroalimentación automatizada",
            "Vender datos de aprendizaje de estudiantes a empresas publicitarias",
            "Tomar decisiones de promoción estudiantil sin revisión humana"
        ],
        correctIndex: 1,
        explanation: "La IA puede usarse éticamente para personalizar rutas de aprendizaje, generar retroalimentación inmediata e identificar estudiantes en riesgo, siempre complementando el juicio profesional docente."
    },
    {
        id: 18,
        category: "Tendencias Actuales",
        difficulty: "básico",
        question: "¿Qué es la 'gamificación' aplicada a la educación?",
        context: "La gamificación puede aumentar el compromiso estudiantil.",
        options: [
            "Crear videojuegos educativos como único método de enseñanza",
            "Convertir toda la educación en un videojuego",
            "Aplicar elementos de diseño de juegos a contextos educativos no lúdicos",
            "Reemplazar los exámenes tradicionales por competencias de videojuegos"
        ],
        correctIndex: 2,
        explanation: "La gamificación consiste en incorporar elementos propios de los juegos (puntos, tablas de clasificación, insignias, narrativas y desafíos progresivos) en actividades educativas para aumentar la motivación."
    },
    {
        id: 19,
        category: "Tendencias Actuales",
        difficulty: "básico",
        question: "¿Qué considera el concepto de 'brecha digital' en el contexto educativo?",
        context: "La equidad digital es un desafío fundamental.",
        options: [
            "La diferencia entre usar Windows vs Mac",
            "La desigualdad en el acceso a tecnologías y conectividad entre diferentes grupos",
            "La diferencia entre generaciones de procesadores",
            "El tiempo que toma descargar archivos grandes"
        ],
        correctIndex: 1,
        explanation: "La brecha digital educativa se refiere a las desigualdades en el acceso a dispositivos, conectividad a internet y habilidades digitales entre estudiantes de diferentes contextos socioeconómicos."
    },
    {
        id: 20,
        category: "Tendencias Actuales",
        difficulty: "intermedio",
        question: "¿Qué es la 'realidad virtual' (VR) y cómo puede aplicarse en educación?",
        context: "Las tecnologías inmersivas están transformando la educación.",
        options: [
            "Un tipo de realidad aumentada más simple",
            "Tecnología que reemplaza completamente el aula física",
            "Entornos simulados en 3D que permiten experiencias inmersivas para explorar lugares difíciles de observar directamente",
            "Útil solo para videojuegos"
        ],
        correctIndex: 2,
        explanation: "La realidad virtual crea entornos completamente simulados en 3D que sumergen al usuario en una experiencia. En educación, permite experiencias como viajes virtuales a lugares históricos o exploración científica."
    },
    {
        id: 21,
        category: "Tendencias Actuales",
        difficulty: "intermedio",
        question: "¿Qué son los 'MOOCs' (Massive Open Online Courses) y cuál es su principal característica?",
        context: "El aprendizaje en línea a gran escala ha crecido enormemente.",
        options: [
            "Cursos exclusivos para universidades de élite",
            "Plataformas de redes sociales para estudiantes universitarios",
            "Cursos en línea abiertos a cualquier persona, sin requisitos de admisión típicos",
            "Un tipo de software para gestión universitaria"
        ],
        correctIndex: 2,
        explanation: "Los MOOCs son cursos en línea abiertos a cualquier persona del mundo, generalmente gratuitos, que pueden inscribir a miles de participantes simultáneamente y ofrecen certificados al completar el curso."
    },
    {
        id: 22,
        category: "Tendencias Actuales",
        difficulty: "básico",
        question: "En el contexto de educación a distancia, ¿qué significa el concepto de 'sincrónico' vs 'asincrónico'?",
        context: "Comprender estas modalidades es esencial para el diseño de cursos.",
        options: [
            "No hay diferencia práctica en educación",
            "Sincrónico significa comunicación en tiempo real; asincrónico permite participación en diferentes momentos",
            "Sincrónico es solo video; asincrónico es solo texto",
            "Sincrónico requiere internet; asincrónico no"
        ],
        correctIndex: 1,
        explanation: "El aprendizaje sincrónico ocurre cuando docente y estudiantes interactúan simultáneamente (videoconferencias), mientras que el asincrónico permite que cada participante acceda al contenido cuando le resulte conveniente."
    },
    {
        id: 23,
        category: "Tendencias Actuales",
        difficulty: "intermedio",
        question: "¿Cuál de los siguientes NO es un beneficio del 'aprendizaje invertido' (flipped classroom)?",
        context: "El modelo de aula invertida ha ganado popularidad en educación superior.",
        options: [
            "Los estudiantes pueden acceder al contenido teórico a su propio ritmo",
            "El tiempo de clase se dedica a actividades prácticas y discusión",
            "Requiere que todos los estudiantes tengan acceso a internet y dispositivos",
            "Elimina completamente la necesidad de evaluación"
        ],
        correctIndex: 3,
        explanation: "El aprendizaje invertido no elimina la necesidad de evaluación. Sus beneficios incluyen acceso al contenido a ritmo propio y tiempo de clase dedicado a actividades interactivas, aunque sí requiere acceso tecnológico."
    }
];

// Exportar para uso en el servidor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = questionsBank;
}
