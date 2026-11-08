import type { Messages } from "@/i18n/messages/en";
import type { Translation } from "@/i18n/translate";

const guide: Translation<Messages["guide"]> = {
  landing: {
    heading: "Un seul endroit pour tout le voyage.",
    intro: "Partagez un voyage avec ceux qui partent. Gardez ensemble la carte, la météo, le programme, les documents, l'assurance, la liste de bagages et qui doit quoi.",
    register: "Créer un compte",
    signIn: "Se connecter",
    features: "Fonctionnalités",
    map: {
      title: "Carte",
      body: "Chaque étape, épinglée et partagée.",
    },
    schedule: {
      title: "Programme",
      body: "Un programme visible par tous.",
    },
    weather: {
      title: "Météo",
      body: "Les prévisions là où vous allez.",
    },
    documents: {
      title: "Documents",
      body: "Passeports, billets et assurances.",
    },
    packing: {
      title: "Bagages",
      body: "Des listes tirées de votre garde-robe.",
    },
    expenses: {
      title: "Dépenses",
      body: "Suivez qui doit quoi.",
    },
  },
  how: {
    metaTitle: "Comment ça marche",
    metaDescription: "Ce que fait chaque partie de Duffle et comment l'utiliser.",
    heading: "Comment fonctionne Duffle",
    intro: "Duffle réunit tout le voyage au même endroit pour tous ceux qui partent : le programme, la météo, l'argent, les documents et les bagages. Voici ce que fait chaque partie.",
    gettingStarted: "Pour commencer",
    steps: {
      create: {
        title: "Créez un voyage",
        body: "Donnez-lui un nom, des dates, les pays visités et la devise du budget du groupe.",
      },
      group: {
        title: "Réunissez le groupe",
        body: "Invitez par e-mail, ou partagez un lien ou un QR code. Toute personne ayant un compte Duffle peut rejoindre.",
      },
      plan: {
        title: "Planifiez ensemble",
        body: "Ajoutez destinations, vols, hébergements et activités. Tout le monde suit le même programme.",
      },
      pack: {
        title: "Bouclez vos valises",
        body: "Consultez la météo, joignez vos documents et faites vos bagages depuis votre garde-robe avec des suggestions adaptées.",
      },
    },
    insideTrip: "Dans un voyage",
    insideTripBody: "Chaque voyage a ces onglets. Tous les participants peuvent les voir et les modifier.",
    trip: {
      overview: {
        title: "Aperçu",
        body: "La page d'accueil du voyage : dates, pays, participants et détails.",
        p1: "Les administrateurs peuvent modifier le voyage, inviter des voyageurs et le supprimer.",
        p2: "Les invitations en attente apparaissent sur votre page Voyages jusqu'à ce que vous les acceptiez ou refusiez.",
      },
      map: {
        title: "Carte",
        body: "Les destinations avec leurs dates, notes et activités, épinglées sur une carte partagée.",
        p1: "Cherchez un lieu par son nom pour l'épingler. Duffle le trouve sur Google Maps.",
        p2: "Ajoutez des activités à une destination et étiquetez-les pour les repérer facilement.",
      },
      weather: {
        title: "Météo",
        body: "Une prévision quotidienne pour chaque destination : température, pluie, vent et conditions.",
        p1: "Les dates à venir utilisent les prévisions, les dates passées la météo enregistrée.",
        p2: "Les suggestions de bagages utilisent les mêmes prévisions.",
      },
      schedule: {
        title: "Programme",
        body: "Chaque jour du voyage en liste ou en calendrier, avec vols et activités dans l'ordre.",
        p1: "Les activités peuvent avoir horaires, lieux, notes et étiquettes, durer toute la journée ou se répéter certains jours.",
        p2: "Saisissez un numéro de vol et une date, et « Rechercher » remplit la compagnie, les aéroports, les terminaux et les horaires. Un vol avec escale ajoute chaque segment.",
        p3: "Duffle surveille les vols à venir et prévient tous les passagers quand les horaires ou terminaux changent.",
      },
      stays: {
        title: "Hébergements",
        body: "Hôtels et locations avec dates d'arrivée et de départ, adresse et numéro de confirmation.",
        p1: "Liez chaque hébergement à une destination pour le regrouper avec cette étape.",
      },
      money: {
        title: "Argent",
        body: "Dépenses partagées, soldes et budgets dans la devise du voyage.",
        p1: "Ajoutez une dépense, choisissez qui a payé et répartissez-la à parts égales, par montants exacts ou en pourcentage.",
        p2: "Payez dans une autre devise et Duffle convertit au taux de change.",
        p3: "Enregistrez un paiement quand quelqu'un règle, et les soldes se mettent à jour.",
        p4: "Les budgets prévoient vols, hébergement, voitures et le reste. Importez-les depuis Excel et transformez une ligne en vraie dépense une fois payée.",
      },
      documents: {
        title: "Documents",
        body: "Billets, réservations et autres fichiers pour tout le groupe, plus les documents personnels joints par les voyageurs.",
        p1: "Votre passeport et votre pièce d'identité ne sont partagés avec le groupe que si vous les joignez à ce voyage.",
      },
      insurance: {
        title: "Assurance",
        body: "La police de chaque voyageur : assureur, dates, numéro, coût et fichier.",
        p1: "Importez la police et Duffle lit l'assureur, les dates, le numéro et la prime.",
      },
      packing: {
        title: "Bagages",
        body: "Vos sacs et ce qu'il y a dans chacun, plus une liste partagée pour le groupe.",
        p1: "La suggestion de vêtements choisit dans votre garde-robe selon la météo et le programme de chaque jour, et explique pourquoi.",
        p2: "Faites glisser les articles d'un sac à l'autre et cochez-les en les rangeant.",
        p3: "La liste partagée sert aux affaires communes du groupe. Chacun coche sa propre copie.",
      },
    },
    yourAccount: "Sur votre compte",
    yourAccountBody: "Ces éléments vous appartiennent et vous suivent dans chaque voyage.",
    account: {
      closet: {
        title: "Garde-robe",
        body: "Vos vêtements et équipements, avec les températures, la météo et les activités de chaque pièce.",
        p1: "Importez une photo et Duffle remplit l'article pour vous.",
        p2: "Votre garde-robe vous suit dans chaque voyage et alimente les suggestions de bagages.",
      },
      documents: {
        title: "Documents",
        body: "Passeports, pièces d'identité et permis restent sur votre compte, privés.",
        p1: "Importez une photo ou un PDF et Duffle lit le type, le nom, le numéro et les dates.",
        p2: "Joignez un document à un voyage seulement quand il en a besoin.",
      },
      notifications: {
        title: "Notifications",
        body: "La cloche affiche les changements de voyage, nouvelles dépenses, invitations et mises à jour de vols.",
        p1: "Activez les alertes push dans le panneau pour les recevoir même quand Duffle est fermé.",
      },
      profile: {
        title: "Profil",
        body: "Votre photo, vos coordonnées et votre pays de résidence.",
        p1: "Votre pays de résidence sert aux drapeaux des destinations de vos voyages.",
      },
    },
    readingTitle: "Vos fichiers lus pour vous.",
    readingBody: "Partout où vous importez un document, une police, une photo de vêtement ou une feuille Excel, Duffle remplit le formulaire pour vous. Vérifiez avant d'enregistrer.",
    goToTrips: "Voir mes voyages",
  },
};

export default guide;
