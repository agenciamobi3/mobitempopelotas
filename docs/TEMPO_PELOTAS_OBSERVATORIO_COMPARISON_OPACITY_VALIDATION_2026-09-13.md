# Validação da fase Opacidade

A fase só deve deixar draft após:

- revisão do HEAD atual sem achados P1/P2 pendentes;
- contratos do Observatório executados por runner funcional ou executor equivalente;
- typecheck concluído;
- build concluído;
- smoke visual em desktop e mobile, incluindo 0%, 50% e 100% de `B sobre A`;
- troca Cortina ↔ Opacidade sem resíduos visuais;
- troca A ↔ B preservando a semântica base/sobreposição;
- saída do comparador restaurando o viewer normal.

Enquanto o GitHub não alocar runner, ausência de steps não deve ser tratada como aprovação nem reprovação do código.
