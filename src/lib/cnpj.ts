/** Valida CNPJ (14 dígitos e dígitos verificadores). Aceita máscara. */
export function cnpjValido(entrada: string): boolean {
  const c = entrada.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const dv = (n: number) => {
    let soma = 0;
    let peso = n - 7;
    for (let i = 0; i < n; i++) {
      soma += Number(c[i]) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}
