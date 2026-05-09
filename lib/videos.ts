export type VideoQuality = "auto" | "240p" | "360p" | "720p";

export type TrainingVideo = {
  id: string;
  order: number;
  title: string;
  duration: string;
  youtubeId: string;
  localSrc?: string;
  category: string;
  description: string;
  steps: string[];
  markers: VideoMarker[];
};

export type VideoMarker = {
  time: number;
  label: string;
};

export const TRAINING_PLAYLIST = {
  title: "Ordem Unida - Desbravadores",
  visibility: "unlisted",
  note: "Substitua os placeholders pelos IDs reais da playlist no YouTube.",
};

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: "posicao-de-sentido",
    order: 1,
    title: "Posicao de Sentido",
    duration: "1min30",
    youtubeId: "0WQeIKMh53M",
    category: "Fundamentos",
    description: "Postura base para iniciar comandos, formaturas e apresentacoes.",
    steps: ["Pes unidos e alinhados", "Corpo firme sem rigidez excessiva", "Olhar no horizonte"],
    markers: [
      { time: 5, label: "Posicao de Sentido" },
      { time: 12, label: "1o Tempo" },
      { time: 14, label: "2o Tempo" },
    ],
  },
  {
    id: "descansar",
    order: 2,
    title: "Descansar",
    duration: "1min15",
    youtubeId: "placeholder2",
    category: "Fundamentos",
    description: "Transicao segura da posicao de sentido para descanso sob comando.",
    steps: ["Mover o pe esquerdo", "Manter alinhamento da unidade", "Evitar conversas ou dispersao"],
    markers: [
      { time: 4, label: "Comando de Descansar" },
      { time: 10, label: "Abertura dos pes" },
      { time: 16, label: "Postura final" },
    ],
  },
  {
    id: "ombro-volver",
    order: 3,
    title: "Ombro Direito/Esquerdo Volver",
    duration: "2min",
    youtubeId: "placeholder3",
    category: "Giros",
    description: "Mudanca de direcao pelo ombro indicado com marcacao firme.",
    steps: ["Ouvir o lado do comando", "Girar no eixo correto", "Fechar a posicao em sentido"],
    markers: [
      { time: 6, label: "Preparacao" },
      { time: 13, label: "Giro pelo ombro" },
      { time: 20, label: "Fechamento" },
    ],
  },
  {
    id: "meia-volta-volver",
    order: 4,
    title: "Meia Volta Volver",
    duration: "1min",
    youtubeId: "placeholder4",
    category: "Giros",
    description: "Giro de 180 graus mantendo cadencia, postura e alinhamento.",
    steps: ["Preparar o corpo", "Girar sem deslocar a linha", "Concluir com equilibrio"],
    markers: [
      { time: 5, label: "Voz executiva" },
      { time: 11, label: "Meia volta" },
      { time: 17, label: "Retorno ao sentido" },
    ],
  },
  {
    id: "marcha-comum-acelerada",
    order: 5,
    title: "Marcha Comum e Acelerada",
    duration: "2min30",
    youtubeId: "placeholder5",
    category: "Marcha",
    description: "Cadencias essenciais para deslocamento da unidade.",
    steps: ["Iniciar no pe correto", "Preservar distancia", "Ajustar ritmo ao comando"],
    markers: [
      { time: 7, label: "Saida em marcha" },
      { time: 18, label: "Marcha comum" },
      { time: 31, label: "Marcha acelerada" },
    ],
  },
  {
    id: "dar-perder-perfil",
    order: 6,
    title: "Dar/Perder Perfil",
    duration: "1min45",
    youtubeId: "placeholder6",
    category: "Formacao",
    description: "Ajuste visual de alinhamento lateral durante a formacao.",
    steps: ["Virar a cabeca conforme indicado", "Conferir alinhamento", "Retornar ao comando"],
    markers: [
      { time: 5, label: "Dar perfil" },
      { time: 12, label: "Conferir linha" },
      { time: 21, label: "Perder perfil" },
    ],
  },
  {
    id: "sentar-levantar",
    order: 7,
    title: "Sentar e Levantar",
    duration: "1min20",
    youtubeId: "placeholder7",
    category: "Movimentos",
    description: "Execucao padronizada para cerimonias, classes e instrucoes.",
    steps: ["Descer com controle", "Manter organizacao", "Levantar em conjunto"],
    markers: [
      { time: 4, label: "Preparar" },
      { time: 10, label: "Sentar" },
      { time: 18, label: "Levantar" },
    ],
  },
  {
    id: "ordinaria",
    order: 8,
    title: "Ordinaria e Marcha Ordinaria",
    duration: "2min",
    youtubeId: "placeholder8",
    category: "Marcha",
    description: "Entrada em marcha ordinaria e manutencao de cadencia.",
    steps: ["Aguardar voz executiva", "Marcar o primeiro passo", "Corrigir distancia em movimento"],
    markers: [
      { time: 6, label: "Ordinaria" },
      { time: 15, label: "Primeiro passo" },
      { time: 26, label: "Cadencia" },
    ],
  },
  {
    id: "formar-desfazer",
    order: 9,
    title: "Formar e Desfazer",
    duration: "1min40",
    youtubeId: "placeholder9",
    category: "Formacao",
    description: "Organizacao e encerramento da unidade em linhas ou colunas.",
    steps: ["Entrar no ponto designado", "Fechar intervalos", "Sair sem cruzar a formacao"],
    markers: [
      { time: 5, label: "Formar" },
      { time: 14, label: "Ajustar intervalos" },
      { time: 24, label: "Desfazer" },
    ],
  },
  {
    id: "continencias",
    order: 10,
    title: "Continencias",
    duration: "1min30",
    youtubeId: "placeholder10",
    category: "Cerimonial",
    description: "Saudacao, respeito e apresentacao em momentos formais.",
    steps: ["Identificar o momento", "Executar com postura", "Retornar ao sentido"],
    markers: [
      { time: 5, label: "Momento da continencia" },
      { time: 12, label: "Execucao" },
      { time: 19, label: "Finalizacao" },
    ],
  },
];

export function findTrainingVideo(id: string) {
  return TRAINING_VIDEOS.find((video) => video.id === id || video.youtubeId === id);
}

export function getYoutubeThumbnail(youtubeId: string) {
  if (youtubeId.startsWith("placeholder")) {
    return null;
  }

  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function formatMarkerTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}
