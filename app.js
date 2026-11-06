const SERVICOS = [
  { id: 1, nome: "Corte de cabelo", tempo: "30 min", preco: 35 },
  { id: 2, nome: "Barba", tempo: "20 min", preco: 25 },
  { id: 3, nome: "Corte + Barba", tempo: "50 min", preco: 55 },
  { id: 4, nome: "Pezinho / Acabamento", tempo: "10 min", preco: 15 },
  { id: 5, nome: "Sobrancelha", tempo: "10 min", preco: 10 },
];
const BARBEIROS = ["Carlos", "Rafael", "Bruno"];
const HORARIOS = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"];
const SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const escolha = { servico: null, barbeiro: null, dia: null, hora: null };
const $ = (id) => document.getElementById(id);

const carregar = () => JSON.parse(localStorage.getItem("agendamentos-resende") || "[]");
const salvar = (lista) => localStorage.setItem("agendamentos-resende", JSON.stringify(lista));

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("mostrar");
  setTimeout(() => t.classList.remove("mostrar"), 2500);
}

function marcar(container, el) {
  container.querySelectorAll(".selecionado").forEach((e) => e.classList.remove("selecionado"));
  el.classList.add("selecionado");
}

function renderServicos() {
  const c = $("servicos");
  SERVICOS.forEach((s) => {
    const el = document.createElement("div");
    el.className = "opcao";
    el.innerHTML = `<div><strong>${s.nome}</strong><small>${s.tempo}</small></div><span class="preco">R$ ${s.preco},00</span>`;
    el.onclick = () => { escolha.servico = s; marcar(c, el); atualizarResumo(); };
    c.appendChild(el);
  });
}

function renderBarbeiros() {
  const c = $("barbeiros");
  BARBEIROS.forEach((b) => {
    const el = document.createElement("button");
    el.className = "chip";
    el.textContent = "💈 " + b;
    el.onclick = () => { escolha.barbeiro = b; marcar(c, el); renderHorarios(); atualizarResumo(); };
    c.appendChild(el);
  });
}

function renderDias() {
  const c = $("dias");
  const hoje = new Date();
  for (let i = 0, adicionados = 0; adicionados < 14; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    if (d.getDay() === 0) continue; // fechado domingo
    adicionados++;
    const iso = d.toISOString().slice(0, 10);
    const el = document.createElement("button");
    el.className = "dia";
    el.innerHTML = `<small>${SEMANA[d.getDay()]}</small><strong>${d.getDate()}</strong>`;
    el.onclick = () => { escolha.dia = iso; escolha.hora = null; marcar(c, el); renderHorarios(); atualizarResumo(); };
    c.appendChild(el);
  }
}

function renderHorarios() {
  const c = $("horarios");
  c.innerHTML = "";
  if (!escolha.dia) { c.innerHTML = '<p class="resumo" style="grid-column:1/-1">Escolha um dia primeiro</p>'; return; }
  const ocupados = carregar()
    .filter((a) => a.dia === escolha.dia && a.barbeiro === escolha.barbeiro)
    .map((a) => a.hora);
  const agora = new Date();
  HORARIOS.forEach((h) => {
    const el = document.createElement("button");
    el.className = "hora";
    el.textContent = h;
    const passado = new Date(`${escolha.dia}T${h}`) < agora;
    el.disabled = ocupados.includes(h) || passado;
    el.onclick = () => { escolha.hora = h; marcar(c, el); atualizarResumo(); };
    c.appendChild(el);
  });
}

function formatarData(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

function atualizarResumo() {
  const { servico, barbeiro, dia, hora } = escolha;
  if (!servico && !barbeiro && !dia) return;
  $("resumo").innerHTML =
    `${servico ? `<strong>${servico.nome}</strong> — R$ ${servico.preco},00<br>` : ""}` +
    `${barbeiro ? `Barbeiro: ${barbeiro}<br>` : ""}` +
    `${dia ? `Data: ${formatarData(dia)}` : ""}${hora ? ` às ${hora}` : ""}`;
}

function confirmar() {
  const nome = $("nome").value.trim();
  const telefone = $("telefone").value.trim();
  const { servico, barbeiro, dia, hora } = escolha;
  if (!servico) return toast("Escolha um serviço");
  if (!barbeiro) return toast("Escolha um barbeiro");
  if (!dia) return toast("Escolha um dia");
  if (!hora) return toast("Escolha um horário");
  if (nome.length < 2) return toast("Digite seu nome");
  if (telefone.replace(/\D/g, "").length < 10) return toast("Digite um telefone válido");

  const lista = carregar();
  lista.push({ id: Date.now(), servico: servico.nome, preco: servico.preco, barbeiro, dia, hora, nome, telefone });
  salvar(lista);
  toast("✅ Agendamento confirmado!");
  escolha.hora = null;
  renderHorarios();
  renderAgendamentos();
}

function renderAgendamentos() {
  const c = $("lista-agendamentos");
  const lista = carregar().sort((a, b) => (a.dia + a.hora).localeCompare(b.dia + b.hora));
  if (!lista.length) { c.innerHTML = '<p class="vazio">Você ainda não tem agendamentos.</p>'; return; }
  c.innerHTML = "";
  lista.forEach((a) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <strong style="color:var(--ouro)">${a.servico}</strong> — R$ ${a.preco},00<br>
      📅 ${formatarData(a.dia)} às ${a.hora}<br>
      💈 ${a.barbeiro}<br>
      👤 ${a.nome} · ${a.telefone}<br>
      <button class="btn-sec">Cancelar</button>`;
    el.querySelector("button").onclick = () => {
      if (!confirm("Cancelar este agendamento?")) return;
      salvar(carregar().filter((x) => x.id !== a.id));
      renderAgendamentos();
      renderHorarios();
      toast("Agendamento cancelado");
    };
    c.appendChild(el);
  });
}

document.querySelectorAll(".menu button").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".menu button").forEach((b) => b.classList.remove("ativo"));
    document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
    btn.classList.add("ativo");
    $(btn.dataset.tela).classList.add("ativa");
    window.scrollTo(0, 0);
  };
});

$("btn-confirmar").onclick = confirmar;
renderServicos();
renderBarbeiros();
renderDias();
renderHorarios();
renderAgendamentos();
