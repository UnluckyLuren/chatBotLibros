export default [
  // Intención: Saludar
  { "frase": "hola", "intencion": "saludar" },
  { "frase": "buenos días", "intencion": "saludar" },
  { "frase": "buenas tardes", "intencion": "saludar" },

  // Intención: Buscar Sinopsis
  { "frase": "de qué trata dune", "intencion": "buscar_sinopsis" },
  { "frase": "dame la sinopsis de fundación", "intencion": "buscar_sinopsis" },
  { "frase": "resumen de 1984", "intencion": "buscar_sinopsis" },
  { "frase": "cuéntame sobre el juego de ender", "intencion": "buscar_sinopsis" },
  { "frase": "qué pasa en neuromante", "intencion": "buscar_sinopsis" },
  { "frase": "trama de solaris", "intencion": "buscar_sinopsis" },

  // Intención: Buscar Autor
  { "frase": "quién escribió dune", "intencion": "buscar_autor" },
  { "frase": "autor de fundación", "intencion": "buscar_autor" },
  { "frase": "quién es el autor de 1984", "intencion": "buscar_autor" },
  { "frase": "creador de neuromante", "intencion": "buscar_autor" },
  { "frase": "quién hizo el marciano", "intencion": "buscar_autor" },

  // Intención: Listar libros de un autor
  { "frase": "qué más escribió asimov", "intencion": "libros_por_autor" },
  { "frase": "libros de frank herbert", "intencion": "libros_por_autor" },
  { "frase": "obras de philip k dick", "intencion": "libros_por_autor" },
  { "frase": "dime los libros de greg egan", "intencion": "libros_por_autor" },

  // Intención: Libros por tema/subgénero
  { "frase": "recomiéndame libros cyberpunk", "intencion": "libros_por_tema" },
  { "frase": "tienes algo de viajes en el tiempo", "intencion": "libros_por_tema" },
  { "frase": "libros sobre inteligencia artificial", "intencion": "libros_por_tema" },
  { "frase": "me gusta la space opera", "intencion": "libros_por_tema" }
];