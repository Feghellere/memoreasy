export interface Usuario {
  id: string;
  email: string;
  nome: string;
  criadoEm: Date;
}

export interface DadosLogin {
  email: string;
  senha: string;
}

export interface DadosCadastro extends DadosLogin {
  nome: string;
  confirmarSenha: string;
}