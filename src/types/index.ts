export interface User {
  id: string;
  email: string;
  nome: string;
  createdAt: Date;
  plano: "free" | "pro" | "premium";
  fotoPerfil?: string;
  role?: "dono" | "barbeiro";
}

export interface Barbearia {
  id: string;
  nome: string;
  plano: "free" | "pro" | "premium";
  createdAt: Date;
  logo?: string;
  paleta?: string;
  cores?: {
    primary: string;
    accent: string;
    background: string;
  };
}

export interface PlanoCliente {
  id: string;
  nome: string;
  preco: number;
  tipo: "mensal" | "bimestral" | "trimestral" | "semestral" | "anual";
  descricao?: string;
  createdAt: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  planoId?: string;
  dataVencimento?: string;
  observacoes?: string;
  fotoPerfil?: string;
  fotosCorte?: string[];
  pontosFidelidade?: number;
  createdAt: Date;
}

export interface Barbeiro {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  senha?: string;
  comissaoServico: number;
  comissaoProduto: number;
  createdAt: Date;
}

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  createdAt: Date;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  custo: number;
  precoVenda: number;
  quantidade: number;
  estoqueMinimo: number;
  createdAt: Date;
}

export interface ProdutoVendido {
  produtoId: string;
  nome: string;
  valor: number;
  quantidade: number;
}

export interface Atendimento {
  id: string;
  cliente: string;
  telefone?: string;
  barbeiroId: string;
  barbeiroNome: string;
  servicoId?: string;
  servicoIds?: string[];
  servicoNome?: string;
  servicoNomes?: string;
  valor: number;
  produtoVendido?: ProdutoVendido;
  comissao: number;
  data: string;
  hora: string;
  status: "agendado" | "em_atendimento" | "finalizado" | "concluido" | "cancelado";
  createdAt: Date;
}

export interface MovimentoEstoque {
  id: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  motivo: string;
  createdAt: Date;
}

export interface Despesa {
  id: string;
  nome: string;
  valor: number;
  categoria: "aluguel" | "luz" | "internet" | "produtos" | "manutencao" | "outros";
  data: string;
  createdAt: Date;
}

export interface CaixaDia {
  id: string;
  data: string;
  abertura: number;
  fechamento?: number;
  totalServicos: number;
  totalProdutos: number;
  totalDespesas: number;
  totalComissoes: number;
  lucroLiquido: number;
  fechado: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  faturamentoDia: number;
  atendimentosDia: number;
  ticketMedio: number;
  comissoesDia: number;
}