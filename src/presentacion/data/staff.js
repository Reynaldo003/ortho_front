// src/presentacion/data/staff.js
import cvAkbitt from "../assets/cvs/CV FISIO AKBITT KRAUSS.pdf";
import cvAreli from "../assets/cvs/CV FISIO ARELI GUTIERREZ.pdf";
import cvClaudio from "../assets/cvs/CV FISIO CLAUDIO GONZALEZ.pdf";
import cvDavid from "../assets/cvs/CV FISIO DAVID YAEL.pdf";
import cvJose from "../assets/cvs/CV FISIO JOSE FERNANDO.pdf";

export const STAFF = [
  {
    id: "dr-hernandez",
    slug: "dr-martin-buganza-tepole",
    role: "Médico Ortopedista",
    name: "Dr. Martín Buganza Tepole",
    seoName: "Dr. Martín Buganza Tepole",
    photo: "/MartinBuganza.png",
    location: "Córdoba, Veracruz",
    years: 19,
    rating: 4.9,
    badges: [
      "UNAM",
      "Cirugía de mano",
      "Alta especialidad",
      "Cedula Profesional: 06062334",
    ],
    bio: "Traumatología y ortopedia con alta especialidad en cirugía de mano. Diagnóstico claro, tratamiento personalizado y seguimiento cercano.",
    seoDescription:
      "Dr. Martín Buganza Tepole, traumatólogo y ortopedista en Córdoba, Veracruz. Conoce su trayectoria, servicios, áreas de especialidad y enfoque de atención en Ortho Clinic.",
    services: [
      "Consulta de primera vez",
      "Seguimiento",
      "Valoración quirúrgica",
    ],
    videoUrl: "https://www.youtube.com/embed/oHqRGEc3ryI",

    profile: {
      bio: "Médico cirujano egresado de Universidad La Salle, con especialidad en Traumatología y Ortopedia por la UNAM, realizada en el Instituto Nacional de Rehabilitación (CDMX). Cuenta con posgrado de alta especialidad en cirugía de mano, área que requiere alta precisión quirúrgica y conocimiento anatómico avanzado. Su trayectoria le ha permitido desarrollar un enfoque clínico integral en el manejo de lesiones complejas del sistema músculo-esquelético.",

      patientsPerYear: 380,
      surgeriesPerYear: 150,
      satisfaction: 98,

      education:
        "Médico Cirujano (Universidad La Salle). Especialidad en Traumatología y Ortopedia (UNAM) – Instituto Nacional de Rehabilitación. Alta especialidad en Cirugía de Mano.",

      experience: [
        "Hospital Covadonga — 8 años",
        "ISSSTE — 10 años",
        "Hospital Naval de Veracruz — 1 año",
      ],

      specialties: [
        "Cirugía de mano y reconstrucción funcional.",
        "Lesiones deportivas de alto rendimiento.",
        "Rehabilitación ortopédica avanzada.",
        "Técnicas que favorecen recuperación rápida y segura.",
      ],

      focus:
        "Diagnósticos claros y tratamientos personalizados orientados a recuperar movilidad y calidad de vida, con acompañamiento cercano desde la primera consulta hasta la rehabilitación completa.",

      research:
        "Actualización médica continua e innovación en tratamientos ortopédicos. Publicación en Arthroscopy (2014) sobre tratamiento comparativo de iliopsoas para snapping hip.",

      publications: [
        "Central Compartment Release Versus Lesser Trochanter Release of the Iliopsoas Tendon for the Treatment of Internal Snapping Hip: A Comparative Study; Victor M. Ilizaliturri Jr., M.D., Martín Buganza-Tepole, M.D. Arthroscopy: The Journal of Arthroscopic and Related Surgery, Vol 30, No 7 (July), 2014: pp 790–795.",
      ],

      patientTypes: [
        "Deportistas amateurs y de alto rendimiento.",
        "Adultos con desgaste articular o problemas degenerativos.",
        "Pacientes con lesiones por accidentes o traumatismos.",
        "Personas con padecimientos en mano, muñeca y extremidades superiores.",
        "Pacientes que requieren valoración quirúrgica especializada.",
      ],

      philosophy:
        "La medicina debe ser precisa, humana y transparente. Mi prioridad es ofrecer diagnósticos claros y tratamientos personalizados que permitan al paciente recuperar su movilidad y calidad de vida. Acompaño cada proceso de forma cercana, desde la primera consulta hasta la rehabilitación completa.",

      languages: "Español (nativo).",

      videos: ["https://www.youtube.com/embed/oHqRGEc3ryI"],

      testimonials: [
        {
          name: "Paciente",
          text: "Diagnóstico claro y tratamiento personalizado. Seguimiento muy cercano.",
        },
        {
          name: "Paciente deportivo",
          text: "Me dio un plan seguro para volver a mi actividad con confianza.",
        },
      ],
    },
  },
  {
    id: "dr-puig",
    slug: "dr-miguel-puig-zentella",
    role: "Médico Ortopedista",
    name: "Dr. Miguel Puig Zentella",
    seoName: "Dr. Miguel Puig Zentella",
    photo: "/MiguelPuig.png",
    location: "Córdoba, Veracruz",
    years: 16,
    rating: 5.0,
    badges: [
      "UNAM",
      "Cirugía de mano",
      "Alta especialidad",
      "Cedula Profesional: 09941258",
    ],
    bio: "Traumatología y ortopedia con alta especialidad en cirugía de mano. Atención basada en evidencia y enfoque funcional.",
    seoDescription:
      "Dr. Miguel Puig Zentella, traumatólogo y ortopedista en Córdoba, Veracruz. Conoce su trayectoria, servicios, áreas de especialidad y enfoque de atención en Ortho Clinic.",
    services: ["Consulta", "Seguimiento", "Valoración especializada"],
    videoUrl: "https://www.youtube.com/embed/-nuHonyEMvU",

    profile: {
      bio: "Médico cirujano egresado de la Universidad UPAEP, con especialidad en Traumatología y Ortopedia por la UNAM, con sede en el Instituto Nacional de Rehabilitación. Cuenta además con posgrado de alta especialidad en cirugía de mano, lo que le permite abordar casos complejos con un enfoque especializado y actualizado.",

      patientsPerYear: 320,
      surgeriesPerYear: 110,
      satisfaction: 97,

      education:
        "Médico Cirujano (UPAEP). Especialidad en Traumatología y Ortopedia (UNAM) – Instituto Nacional de Rehabilitación. Alta especialidad en Cirugía de Mano.",

      experience: [
        "Hospital Covadonga — 1 año",
        "IMSS — 5 años",
        "OCC — 10 años (trabajando en conjunto con el Dr. Martín Buganza Tepole)",
      ],

      specialties: [
        "Tratamiento integral de lesiones músculo-esqueléticas.",
        "Cirugía ortopédica especializada.",
        "Rehabilitación funcional y reintegración a la vida diaria.",
        "Manejo de pacientes con lesiones crónicas y agudas.",
      ],

      focus:
        "Atención ortopédica basada en evidencia, orientada a la funcionalidad. Comunicación clara, manejo responsable del dolor y seguimiento cercano durante todo el proceso.",

      research:
        "Investigación y formación continua en ortopedia, cirugía de mano y tratamiento funcional de lesiones musculoesqueléticas.",

      patientTypes: [
        "Deportistas con lesiones articulares, musculares o traumáticas.",
        "Adultos con padecimientos degenerativos o lesiones por sobrecarga.",
        "Pacientes con lesiones derivadas de accidentes.",
        "Personas que requieren valoración ortopédica especializada.",
        "Pacientes que buscan un seguimiento cercano y profesional.",
      ],

      philosophy:
        "La atención traumatológica debe ser precisa, oportuna y orientada a la funcionalidad. Mi enfoque se basa en realizar una valoración integral de cada lesión para ofrecer tratamientos adecuados que permitan una recuperación segura y eficaz. Priorizo la comunicación clara con el paciente, el manejo responsable del dolor y un seguimiento cercano durante todo el proceso, con el objetivo de restablecer la movilidad y la calidad de vida.",

      languages: "Español (nativo).",

      videos: ["https://www.youtube.com/embed/-nuHonyEMvU"],

      testimonials: [
        {
          name: "Paciente",
          text: "Valoración integral y plan claro. Me sentí acompañado en todo momento.",
        },
        {
          name: "Paciente",
          text: "Excelente seguimiento y comunicación. Recuperación segura y progresiva.",
        },
      ],
    },
  },
  // ---------------------------
  // Fisioterapia (si los sigues usando en la app)
  // ---------------------------
  {
    id: "fisio-akbitt-krauss",
    slug: "akbitt-krauss-pena",
    name: "Lic. Akbitt Krauss Peña",
    role: "Fisioterapeuta",
    photo: "/krauss.png",
    location: "Córdoba, Ver.",
    years: 5,
    rating: 4.8,
    badges: [
      "Cédula 13622910",
      "Geriatría",
      "Activación adulto mayor",
      "RCP/DEA",
    ],
    bio: "Lic. en Terapia Física con experiencia en rehabilitación clínica y activación física para adultos mayores. Actualmente en formación de maestría en fisioterapia geriátrica.",
    cvUrl: cvAkbitt,
    profile: {
      bio: "Egresado de fisioterapia (IPETH), con experiencia en clínica de rehabilitación, campo deportivo y atención a pacientes de diferentes diagnósticos. Enfoque en organización, planeación y trabajo interdisciplinario.",
      education:
        "Licenciatura (IPETH) · Maestría en Fisioterapia Geriátrica (Universidad Montrer, en curso).",
      specialties: [
        "Rehabilitación geriátrica y activación física del adulto mayor",
        "Atención clínica músculo-esquelética",
        "Soporte básico en reanimación (RCP) y uso de DEA",
      ],
      experience: [
        "Star al 100 (Córdoba, Ver.) — Fisioterapeuta (2025–presente)",
        "DIF San Miguel de Allende (Gto.) — Fisioterapeuta (2022–2024)",
        "DIF San Miguel de Allende (Gto.) — Servicio social (2021–2022)",
        "ISSSTE Rehabilitación Orizaba (Ver.) — Voluntariado (2021)",
        "Orthokine (Puebla) — Practicante (2021)",
        "Recovery (Puebla) — Fisioterapia en campo (2020)",
        "CRIPETH (Puebla) — Practicante (2019)",
      ],
      certifications: [
        "Activación física del adulto mayor (CODE Guanajuato, 2023)",
        "RCP automático y uso de desfibrilador externo (PACE, 2022)",
        "HIIT / Retorno seguro al trabajo post COVID-19 (2020)",
        "Prevención COVID-19 (IMSS, 2020)",
        "Congreso Internacional Momentum (2019)",
      ],
      languages: "Español · Inglés básico",
    },
  },

  {
    id: "fisio-areli-gutierrez",
    slug: "areli-gutierrez-castro",
    name: "Lic. Areli Gutiérrez Castro",
    role: "Fisioterapeuta",
    photo: "/Areli.png",
    location: "Córdoba, Ver.",
    years: 2,
    rating: 4.7,
    badges: ["Fisioterapia deportiva", "Electroterapia clínica", "Crioterapia"],
    bio: "Lic. en Terapia Física con experiencia hospitalaria y clínica. Manejo de pacientes pre/post quirúrgicos y enfoque en rehabilitación deportiva.",
    cvUrl: cvAreli,
    profile: {
      bio: "Egresada de la Universidad Politécnica de Huatusco (2020–2024). Experiencia en entorno hospitalario (Covadonga) y atención de múltiples perfiles clínicos: postquirúrgicos, alteraciones posturales, dolor agudo/crónico y geriatría.",
      education:
        "Licenciatura en Terapia Física — Universidad Politécnica de Huatusco (2020–2024).",
      specialties: [
        "Atención preoperatoria y postquirúrgica",
        "Dolor agudo y crónico",
        "Alteraciones posturales y readaptación",
        "Terapia respiratoria y pacientes neurológicos (apoyo clínico)",
      ],
      experience: [
        "Clínica Star al 100 (Córdoba, Ver.) — Atención a pacientes y aplicación de agentes físicos (2025)",
        "Hospitales Covadonga (Córdoba) — Servicio social (2024–2025)",
        "Hospitales Covadonga (Boca del Río) — Estadías (2023)",
      ],
      certifications: [
        "Crioterapia en procesos agudos (2021)",
        "Electroterapia clínica (2024)",
        "Diplomado de fisioterapia deportiva (2025)",
      ],
      languages: "Español · Inglés básico",
    },
  },

  {
    id: "fisio-claudio-gonzalez",
    slug: "claudio-gonzalez-olvera",
    name: "Lic. Claudio González Olvera",
    role: "Fisioterapeuta",
    photo: "/Claudio.png",
    location: "Córdoba, Ver.",
    years: 2,
    rating: 4.7,
    badges: [
      "Ejercicio terapéutico",
      "Agentes físicos",
      "Razonamiento clínico",
    ],
    bio: "Lic. en Terapia Física con enfoque en rehabilitación deportiva y ejercicio terapéutico progresivo basado en evidencia (isométrico, concéntrico, excéntrico y pliométrico).",
    cvUrl: cvClaudio,
    profile: {
      bio: "Egresado de la Universidad Politécnica de Huatusco (2020–2024). Experiencia en rehabilitación deportiva y clínica hospitalaria, con énfasis en movilidad precoz y prevención de desacondicionamiento físico en pacientes encamados.",
      education:
        "Licenciatura en Terapia Física — Universidad Politécnica de Huatusco (2020–2024).",
      specialties: [
        "Diseño de programas de ejercicio terapéutico progresivo",
        "Rehabilitación deportiva",
        "Terapias físicas: ultrasonido, termoterapia, TENS, interferenciales",
        "Movilidad precoz y prevención de desacondicionamiento",
      ],
      experience: [
        "Star al 100 — Fisioterapia y rehabilitación deportiva (2025–actual)",
        "Hospitales Covadonga — Fisioterapeuta (2024–2025)",
      ],
      certifications: [],
      languages: "Español",
    },
  },

  {
    id: "fisio-david-yael",
    slug: "david-yael-de-la-rosa-quezada",
    name: "Lic. David Yael de la Rosa Quezada",
    role: "Fisioterapeuta",
    photo: "/David.png",
    location: "Córdoba, Ver.",
    years: 2,
    rating: 4.7,
    badges: [
      "Anatomía palpatoria",
      "Lesiones músculo-esqueléticas",
      "Fisioterapia invasiva",
    ],
    bio: "Lic. en Terapia Física con experiencia clínica en pacientes post-operatorios, geriátricos y deportivos. Manejo de agentes físicos y enfoque en tratamiento individualizado.",
    cvUrl: cvDavid,
    profile: {
      bio: "Egresado de la Universidad Politécnica de Huatusco (2020–2024). Experiencia hospitalaria en Covadonga y práctica clínica con abordaje a lesiones agudas/crónicas, postquirúrgicos y pacientes con amputación (pre y post protésico).",
      education:
        "Licenciatura en Terapia Física — Universidad Politécnica de Huatusco (2020–2024).",
      specialties: [
        "Tratamiento pre y post protésico en amputación (miembros inferiores)",
        "Pacientes post-operatorios y geriátricos",
        "Lesiones deportivas, agudas y crónicas",
        "Agentes físicos y planificación de tratamiento",
      ],
      experience: [
        "Dynamis Clinic (Córdoba, Ver.) — Fisioterapeuta (2025–actual)",
        "FISIUM Clínicas (Córdoba, Ver.) — Fisioterapeuta (2025)",
        "Hospitales Covadonga — Servicio social (2024–2025)",
        "Hospitales Covadonga — Formación dual/estadías (2023)",
      ],
      certifications: [
        "Workshop de Anatomía Palpatoria (2022)",
        "Traumatología y técnicas en lesiones músculo-esqueléticas (2022)",
        "Fisioterapia invasiva y razonamiento clínico (2022)",
      ],
      languages: "Español · Inglés básico",
    },
  },

  {
    id: "fisio-jose-fernando",
    slug: "jose-fernando-porras-pulido",
    name: "Lic. José Fernando Porras Pulido",
    role: "Fisioterapeuta",
    photo: "/Fernando.png",
    location: "Río Blanco / Córdoba, Ver.",
    years: 2,
    rating: 4.7,
    badges: ["Geriatría", "Pediatría", "Post-quirúrgico", "Agentes físicos"],
    bio: "Lic. en Terapia Física con experiencia en unidad básica de rehabilitación y entorno hospitalario. Atención a pacientes pediátricos y geriátricos con patologías traumáticas y neurológicas.",
    cvUrl: cvJose,
    profile: {
      bio: "Egresado de la Universidad Politécnica de Huatusco (2020–2024). Experiencia en rehabilitación en Nogales y servicio social en Covadonga con manejo de pacientes preoperatorios, postquirúrgicos, neurológicos, respiratorios, traumatológicos y deportivos.",
      education:
        "Licenciatura en Terapia Física — Universidad Politécnica de Huatusco (2020–2024).",
      specialties: [
        "Rehabilitación geriátrica y pediátrica",
        "Manejo de dolor agudo/crónico",
        "Postquirúrgico y alteraciones posturales",
        "Apoyo con agentes físicos, electroterapia, hidroterapia y mecanoterapia",
      ],
      experience: [
        "Hospitales Covadonga (Córdoba) — Terapeuta / Servicio social (2024–2025)",
        "Unidad básica de rehabilitación de Nogales — Terapeuta (2023)",
      ],
      certifications: [],
      languages: "Español · Inglés básico",
    },
  },
];
