export interface ElementoLousa {
  id?: string;
  tipo?: 'linha' | 'retangulo' | 'circulo' | 'texto' | 'imagem' | 'seta';
  x?: number;
  y?: number;
  largura?: number;
  altura?: number;
  raio?: number;
  texto?: string;
  cor?: string;
  espessura?: number;
  pontos?: { x: number; y: number }[];
  imgSrc?: string;
  xFim?: number;
  yFim?: number;
}

export interface Ferramenta {
  id: string;
  icone: React.ComponentType<any>;
  nome: string;
} 