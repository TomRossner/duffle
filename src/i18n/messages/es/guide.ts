import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const guide: Translation<Messages["guide"]> = {
  landing: {
    heading: "Un solo lugar para todo el viaje.",
    intro: "Comparte un viaje con quienes van. Mantén juntos el mapa, el tiempo, el itinerario, los documentos, el seguro, la lista de equipaje y quién debe qué.",
    register: "Crear una cuenta",
    signIn: "Iniciar sesión",
    features: "Funciones",
    map: {
      title: "Mapa",
      body: "Cada parada, marcada y compartida.",
    },
    schedule: {
      title: "Itinerario",
      body: "Un itinerario que todos pueden ver.",
    },
    weather: {
      title: "Tiempo",
      body: "Previsiones para tu destino.",
    },
    documents: {
      title: "Documentos",
      body: "Pasaportes, billetes y seguros.",
    },
    packing: {
      title: "Equipaje",
      body: "Listas creadas a partir de tu armario.",
    },
    expenses: {
      title: "Gastos",
      body: "Controla quién debe qué.",
    },
  },
  how: {
    metaTitle: "Cómo funciona",
    metaDescription: "Qué hace cada parte de Duffle y cómo usarla.",
    heading: "Cómo funciona Duffle",
    intro: "Duffle reúne todo el viaje en un solo lugar para todos los que van: el plan, el tiempo, el dinero, los documentos y el equipaje. Esto es lo que hace cada parte.",
    gettingStarted: "Primeros pasos",
    steps: {
      create: {
        title: "Crea un viaje",
        body: "Ponle nombre, fechas, los países que visitarás y la moneda en la que presupuesta el grupo.",
      },
      group: {
        title: "Suma al grupo",
        body: "Invita por correo o comparte un enlace o un código QR. Cualquiera con una cuenta de Duffle puede unirse.",
      },
      plan: {
        title: "Planificad juntos",
        body: "Añade destinos, vuelos, alojamientos y actividades. Todos trabajan con el mismo plan.",
      },
      pack: {
        title: "Haz la maleta y vete",
        body: "Mira la previsión, adjunta tus documentos y prepara la maleta desde tu armario con sugerencias según el tiempo.",
      },
    },
    insideTrip: "Dentro de un viaje",
    insideTripBody: "Cada viaje tiene estas pestañas. Todos los participantes pueden verlas y editarlas.",
    trip: {
      overview: {
        title: "Resumen",
        body: "La página principal del viaje: fechas, países, quiénes van y los detalles.",
        p1: "Los administradores pueden editar el viaje, invitar viajeros y eliminarlo.",
        p2: "Las invitaciones pendientes aparecen en tu página de viajes hasta que las aceptes o rechaces.",
      },
      map: {
        title: "Mapa",
        body: "Destinos con sus fechas, notas y actividades, marcados en un mapa compartido.",
        p1: "Busca un lugar por su nombre para marcarlo. Duffle lo busca en Google Maps.",
        p2: "Añade actividades a un destino y etiquétalas para verlas de un vistazo.",
      },
      weather: {
        title: "Tiempo",
        body: "Una previsión diaria para cada destino: temperatura, lluvia, viento y estado del cielo.",
        p1: "Las fechas próximas usan la previsión y las pasadas, el tiempo registrado.",
        p2: "Las sugerencias de equipaje usan la misma previsión.",
      },
      schedule: {
        title: "Itinerario",
        body: "Cada día del viaje como lista o calendario, con vuelos y planes en orden.",
        p1: "Los planes pueden tener horas, lugares, notas y etiquetas, durar todo el día o repetirse ciertos días.",
        p2: "Escribe un número de vuelo y una fecha y «Buscar» rellena la aerolínea, los aeropuertos, las terminales y las horas. Un vuelo con escala añade cada tramo.",
        p3: "Duffle sigue comprobando los próximos vuelos y avisa a todos los pasajeros cuando cambian las horas o las terminales.",
      },
      stays: {
        title: "Alojamientos",
        body: "Hoteles y alquileres con fechas de entrada y salida, dirección y número de confirmación.",
        p1: "Vincula cada alojamiento a un destino para tenerlo junto al resto de esa parada.",
      },
      money: {
        title: "Dinero",
        body: "Gastos compartidos, saldos y hojas de presupuesto en la moneda del viaje.",
        p1: "Añade un gasto, elige quién pagó y divídelo a partes iguales, por importes exactos o por porcentaje.",
        p2: "Paga en otra moneda y Duffle la convierte al tipo de cambio.",
        p3: "Registra un pago cuando alguien salda cuentas y los saldos se actualizan.",
        p4: "Las hojas de presupuesto planifican vuelos, alojamiento, coches y lo que sea. Impórtalas desde Excel y convierte una fila en un gasto real cuando se pague.",
      },
      documents: {
        title: "Documentos",
        body: "Billetes, reservas y otros archivos para todo el grupo, más los documentos personales que adjuntan los viajeros.",
        p1: "Tu pasaporte y tu DNI solo se comparten con el grupo cuando los adjuntas a este viaje.",
      },
      insurance: {
        title: "Seguro",
        body: "La póliza de cada viajero: aseguradora, fechas, número, coste y el archivo.",
        p1: "Sube la póliza y Duffle lee la aseguradora, las fechas, el número y la prima.",
      },
      packing: {
        title: "Equipaje",
        body: "Tus bolsas y lo que va en cada una, más una lista compartida para el grupo.",
        p1: "Sugerir ropa elige prendas de tu armario según la previsión y los planes de cada día, y explica por qué.",
        p2: "Arrastra prendas entre bolsas y márcalas al guardarlas.",
        p3: "La lista compartida es para lo que el grupo lleva en común. Cada uno marca su propia copia.",
      },
    },
    yourAccount: "En tu cuenta",
    yourAccountBody: "Esto es tuyo y te acompaña a cada viaje.",
    account: {
      closet: {
        title: "Armario",
        body: "La ropa y el equipo que tienes, con las temperaturas, el tiempo y las actividades para las que sirve cada prenda.",
        p1: "Sube una foto y Duffle rellena la prenda por ti.",
        p2: "Tu armario te acompaña a cada viaje y alimenta las sugerencias de equipaje.",
      },
      documents: {
        title: "Documentos",
        body: "Pasaportes, DNI y permisos se quedan en tu cuenta, solo para ti.",
        p1: "Sube una foto o un PDF y Duffle lee el tipo, el nombre, el número y las fechas.",
        p2: "Adjunta un documento a un viaje solo cuando ese viaje lo necesite.",
      },
      notifications: {
        title: "Notificaciones",
        body: "La campana muestra cambios del viaje, gastos nuevos, invitaciones y novedades de vuelos.",
        p1: "Activa las alertas push en el panel para recibirlas aunque Duffle no esté abierto.",
      },
      profile: {
        title: "Perfil",
        body: "Tu foto, tus datos de contacto y tu país de residencia.",
        p1: "Tu país de residencia se usa para las banderas de destino de tus viajes.",
      },
    },
    readingTitle: "Leemos los archivos por ti.",
    readingBody: "Allí donde subas un documento, una póliza, una foto de ropa o una hoja de Excel, Duffle rellena el formulario por ti. Revisa lo que leyó antes de guardar.",
    goToTrips: "Ir a mis viajes",
  },
};

export default guide;
