import { useState } from 'react';
import { FiSearch, FiHelpCircle } from 'react-icons/fi';
import './styles.css';
import api from './services/api';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

const TIPOS = ['Todos','Rua','Avenida','Travessa','Alameda','Praça','Estrada','Rodovia','Viela'];

function App() {
  const [activeTab, setActiveTab] = useState('cep');

  // Tab CEP
  const [input, setInput] = useState('');
  const [cep, setCep] = useState({});

  // Tab Endereço
  const [uf, setUf] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [tipo, setTipo] = useState('Todos');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [resultados, setResultados] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearchCep() {
    if (input === '') {
      alert('Preencha algum CEP!');
      return;
    }
    try {
      const response = await api.get(`${input}/json`);
      setCep(response.data);
      setInput('');
    } catch {
      alert('Ops, erro ao buscar!');
      setInput('');
    }
  }

  async function handleSearchEndereco() {
    if (!uf) { alert('Selecione a UF!'); return; }
    if (!localidade.trim()) { alert('Preencha a Localidade!'); return; }
    if (!logradouro.trim()) { alert('Preencha o Logradouro!'); return; }

    // Remove números, vírgulas e caracteres especiais do logradouro — apenas o nome da rua
    const logradouroLimpo = logradouro.replace(/[0-9,;.]/g, '').trim();
    if (!logradouroLimpo) { alert('Logradouro inválido. Digite apenas o nome da rua.'); return; }

    setLoading(true);
    setResultados([]);
    try {
      const response = await api.get(`${uf}/${encodeURIComponent(localidade.trim())}/${encodeURIComponent(logradouroLimpo)}/json/`);
      let dados = Array.isArray(response.data) ? response.data : [];

      if (tipo !== 'Todos') {
        dados = dados.filter(r =>
          r.logradouro.toLowerCase().startsWith(tipo.toLowerCase())
        );
      }

      if (numero.trim()) {
        dados = dados.filter(r =>
          r.complemento.toLowerCase().includes(numero.toLowerCase())
        );
      }

      if (dados.length === 0) {
        alert('Nenhum resultado encontrado.');
      }
      setResultados(dados);
    } catch {
      alert('Ops, erro ao buscar endereço!');
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setCep({});
    setResultados([]);
  }

  return (
    <div className="container">
      <h1 className="title">Buscador CEP</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'cep' ? 'active' : ''}`}
          onClick={() => handleTabChange('cep')}
        >
          Busca por CEP
        </button>
        <button
          className={`tab ${activeTab === 'endereco' ? 'active' : ''}`}
          onClick={() => handleTabChange('endereco')}
        >
          Busca por Endereço
        </button>
      </div>

      {activeTab === 'cep' && (
        <>
          <div className="containerInput">
            <input
              type="text"
              placeholder="Digite seu CEP..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCep()}
            />
            <button className="buttonSearch" onClick={handleSearchCep}>
              <FiSearch size={25} color="#fff" />
            </button>
          </div>

          {Object.keys(cep).length > 0 && (
            <main className="main">
              <h2>CEP: {cep.cep}</h2>
              <span>{cep.logradouro}</span>
              {cep.complemento && <span>Complemento: {cep.complemento}</span>}
              <span>{cep.bairro}</span>
              <span>{cep.localidade} - {cep.uf}</span>
            </main>
          )}
        </>
      )}

      {activeTab === 'endereco' && (
        <>
          <div className="formCard">
            <div className="formGrid">
              <div className="formGroup">
                <label>UF: <span className="required">*</span></label>
                <select value={uf} onChange={(e) => setUf(e.target.value)}>
                  <option value="">Selecione</option>
                  {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="formGroup">
                <label>
                  Localidade: <span className="required">*</span>
                  <span
                    className="tooltipWrapper"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <FiHelpCircle size={16} className="helpIcon" />
                    {showTooltip && (
                      <span className="tooltip">Mínimo 3 caracteres. Ex: São Paulo</span>
                    )}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={localidade}
                  onChange={(e) => setLocalidade(e.target.value)}
                />
              </div>

              <div className="formGroup">
                <label>Tipo:</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="formGroup">
                <label>Logradouro: <span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Ex: Paulista (só o nome)"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                />
              </div>
            </div>

            <div className="formGroup fullWidth">
              <label>Nº/Lote/Apto/Casa:</label>
              <input
                type="text"
                placeholder="Ex: 1000"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>

            <button className="buttonSearchEndereco" onClick={handleSearchEndereco} disabled={loading}>
              <FiSearch size={18} />
              {loading ? ' Buscando...' : ' Buscar'}
            </button>
          </div>

          {resultados.length > 0 && (
            <div className="resultsList">
              <p className="resultsCount">{resultados.length} resultado(s) encontrado(s)</p>
              {resultados.map((r, i) => (
                <div key={i} className="resultCard">
                  <strong>{r.cep}</strong>
                  <span>{r.logradouro}</span>
                  {r.complemento && <span className="complemento">{r.complemento}</span>}
                  <span>{r.bairro}</span>
                  <span>{r.localidade} - {r.uf}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
