import { db, auth } from "./firebase-config.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let usuarioAtual = null;

onAuthStateChanged(auth, (user) => {

    if (!user) {
        console.log("Usuário não logado");
        return;
    }

    usuarioAtual = user;

    const nomeInput = document.getElementById("nome");
    const emailRecuperacao = document.getElementById("emailRecuperacao");

    if (nomeInput) nomeInput.value = user.email;
    if (emailRecuperacao) emailRecuperacao.value = user.email;

    carregarPerfil();
    carregarPerguntas();
});

window.salvarPerfil = function () {
    const nome = document.getElementById("nome")?.value || "";
    const turma = document.getElementById("turma")?.value || "";
    const curso = document.getElementById("curso")?.value || "";
    const fotoInput = document.getElementById("foto");

    let perfil = { nome, turma, curso, foto: "" };

    if (fotoInput && fotoInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
            perfil.foto = e.target.result;
            localStorage.setItem("perfilAluno", JSON.stringify(perfil));
            alert("Perfil salvo com sucesso!");
            carregarPerfil();
        };

        reader.readAsDataURL(fotoInput.files[0]);

    } else {
        localStorage.setItem("perfilAluno", JSON.stringify(perfil));
        alert("Perfil salvo com sucesso!");
        carregarPerfil();
    }
}

function carregarPerfil() {
    const dados = JSON.parse(localStorage.getItem("perfilAluno"));
    if (!dados) return;

    if (document.getElementById("nome") && dados.nome) {
        document.getElementById("nome").value = dados.nome;
    }

    if (document.getElementById("turma"))
        document.getElementById("turma").value = dados.turma || "";
}

const disciplinas = [
    "Artes 1","Biologia 1","Ciência, Tecnologia e Sociedade",
    "Cidadania e Ética 1","Filosofia 1","Física 1","Geografia 1",
    "História 1","Informática e Redes","Língua Inglesa 1",
    "Língua Portuguesa 1","Matemática 1","Programação 1",
    "Projeto e Prática 1","Química 1",
    "Banco de Dados","Desenvolvimento Web","Programação 2",
    "Matemática 2","Física 2","Química 2",
    "Programação 3","Matemática 3","Física 3",
    "Química 3","Testes e Software","Empreendedorismo"
];

function filtrarDisciplinas() {
    const input = document.getElementById("disciplina")?.value.toLowerCase() || "";
    const datalist = document.getElementById("listaSugestoes");
    if (!datalist) return;

    datalist.innerHTML = "";

    disciplinas
        .filter(d => d.toLowerCase().includes(input))
        .forEach(d => {
            const option = document.createElement("option");
            option.value = d;
            datalist.appendChild(option);
        });
}

window.publicarPergunta = async function () {

    console.log("1 - função iniciou");

    try {

        console.log("2 - dentro do try");

        console.log("usuarioAtual:", usuarioAtual);

        if (!usuarioAtual) {
            console.log("3 - sem usuário");
            alert("Faça login para publicar.");
            return;
        }

        const tituloEl = document.getElementById("titulo");
        const disciplinaEl = document.getElementById("disciplina");
        const textoEl = document.getElementById("texto");

        console.log("4 - elementos:", tituloEl, disciplinaEl, textoEl);

        const titulo = tituloEl?.value.trim();
        const disciplina = disciplinaEl?.value.trim();
        const texto = textoEl?.value.trim();

        console.log("5 - valores:", titulo, disciplina, texto);

        if (!titulo || !disciplina || !texto) {
            console.log("6 - campos vazios");
            alert("Preencha todos os campos!");
            return;
        }

        console.log("7 - tentando salvar no Firebase");

        await addDoc(collection(db, "perguntas"), {
            uid: usuarioAtual.uid,
            nome: usuarioAtual.email,
            email: usuarioAtual.email,
            titulo,
            disciplina,
            texto,
            curtidas: 0,
            data: serverTimestamp()
        });

        console.log("8 - salvou");

        alert("Pergunta publicada!");

    } catch (error) {
        console.error(" ERRO REAL:", error);
        alert("Erro: " + error.message);
    }
};


async function carregarPerguntas() {

    const container = document.getElementById("minhasPerguntas");
    if (!container) return;

    container.innerHTML = "";

    try {

        const snapshot = await getDocs(collection(db, "perguntas"));
            if (snapshot.empty) {
                container.innerHTML = "<p>Nenhuma pergunta ainda.</p>";
                return;
            }

        snapshot.forEach((item) => {

            const p = item.data();
            const id = item.id;

            let botoesAutor = "";

            if (usuarioAtual && usuarioAtual.uid === p.uid) {
                botoesAutor = `
                    <button onclick="editarPergunta('${id}')">✏️ Editar</button>
                    <button onclick="excluirPergunta('${id}')">🗑 Excluir</button>
                `;
            }

            const card = document.createElement("div");
            card.className = "cardPergunta";

            card.innerHTML = `
                <h4>${p.titulo || "Sem título"}</h4>
                <small>
                    ${p.disciplina || ""} | ${p.nome || p.email || "Usuário"}
                </small>
                <p>${p.texto || ""}</p>

                <div class="acoesPergunta">
                    <button onclick="curtirPergunta('${id}')">
                        👍 ${p.curtidas || 0}
                    </button>

                    <button onclick="abrirComentarios('${id}')">
                        💬 Comentários
                    </button>

                    ${botoesAutor}
                </div>

                <div id="comentarios-${id}" class="comentariosBox"></div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar perguntas:", error);
    }
}

window.curtirPergunta = async function (id) {

    if (!usuarioAtual) {
        alert("Faça login.");
        return;
    }

    const likeRef = doc(db, "perguntas", id, "likes", usuarioAtual.uid);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
        alert("Você já curtiu.");
        return;
    }

    await setDoc(likeRef, { uid: usuarioAtual.uid });

    const perguntaRef = doc(db, "perguntas", id);
    const perguntaSnap = await getDoc(perguntaRef);

    const atual = perguntaSnap.data().curtidas || 0;

    await updateDoc(perguntaRef, {
        curtidas: atual + 1
    });

    carregarPerguntas();
};

window.excluirPergunta = async function (id) {
    if (!confirm("Deseja excluir esta pergunta?")) return;

    await deleteDoc(doc(db, "perguntas", id));
    carregarPerguntas();
};

window.editarPergunta = async function (id) {
    const novoTexto = prompt("Digite o novo texto:");
    if (!novoTexto || novoTexto.trim() === "") return;

    await updateDoc(doc(db, "perguntas", id), {
        texto: novoTexto.trim()
    });

    carregarPerguntas();
};

window.abrirComentarios = async function (id) {

    const box = document.getElementById("comentarios-" + id);

    if (box.dataset.aberto === "true") {
        box.innerHTML = "";
        box.dataset.aberto = "false";
        return;
    }

    box.dataset.aberto = "true";

    box.innerHTML = `
        <textarea id="txt-${id}"></textarea>
        <button onclick="enviarComentario('${id}')">Enviar</button>
        <div id="lista-${id}"></div>
    `;

    const lista = document.getElementById("lista-" + id);

    const snapshot = await getDocs(
        collection(db, "perguntas", id, "comentarios")
    );

    snapshot.forEach((docItem) => {
        const c = docItem.data();

        lista.innerHTML += `
            <div>
                <b>${c.nome}</b>
                <p>${c.texto}</p>
            </div>
        `;
    });
};

window.enviarComentario = async function (id) {

    if (!usuarioAtual) {
        alert("Faça login.");
        return;
    }

    const input = document.getElementById("txt-" + id);
    const texto = input.value.trim();

    if (!texto) return;

    await addDoc(
        collection(db, "perguntas", id, "comentarios"),
        {
            uid: usuarioAtual.uid,
            nome: usuarioAtual.email,
            texto,
            data: serverTimestamp()
        }
    );

    abrirComentarios(id);
};

function atualizarConteudosDisciplina() {
    const container = document.getElementById("conteudosDisciplina");
    if (!container) return;

    container.innerHTML = "";

    let conteudos =
        JSON.parse(localStorage.getItem("conteudos")) || [];

    conteudos.forEach(c => {

        const card = document.createElement("div");

        card.innerHTML = `
            <h4>${c.titulo}</h4>
            <p>${c.descricao}</p>
        `;

        container.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarConteudosDisciplina();
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPergunta");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            console.log("submit funcionando");

            await publicarPergunta();
        });
    }
});