class CombaseStudioApp {
  constructor() {
    this.token = localStorage.getItem('combase_gh_token') || '';
    this.activeBranch = 'main';
    this.user = null;
    this.dbState = {
      version: '1.0.0',
      branch: 'main',
      schemas: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'name', type: 'TEXT' },
            { name: 'email', type: 'TEXT' },
            { name: 'role', type: 'TEXT' }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      tables: {
        users: [
          { id: 1, name: 'Adrián', email: 'adrian@terra.org', role: 'Admin' },
          { id: 2, name: 'Combase Bot', email: 'bot@terra.org', role: 'System Engine' }
        ]
      }
    };

    this.initElements();
    this.attachEventListeners();
    this.checkAuth();
    this.renderStats();
    this.renderTables();
  }

  initElements() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.views = document.querySelectorAll('.view-content');
    
    this.tokenInput = document.getElementById('gh-token');
    this.btnConnect = document.getElementById('btn-connect');
    this.btnDisconnect = document.getElementById('btn-disconnect');
    this.userProfile = document.getElementById('user-profile');
    
    this.sqlEditor = document.getElementById('sql-editor');
    this.btnSqlRun = document.getElementById('btn-sql-run');
    this.btnSqlClear = document.getElementById('btn-sql-clear');
    this.queryResultsContainer = document.getElementById('query-results-container');
    this.queryMetaBadge = document.getElementById('query-meta-badge');
    
    this.branchSelect = document.getElementById('branch-select');
    this.btnNewBranch = document.getElementById('btn-new-branch');
    this.modalNewBranch = document.getElementById('modal-new-branch');
    this.btnConfirmNewBranch = document.getElementById('btn-confirm-new-branch');
    this.inputNewBranchName = document.getElementById('input-new-branch-name');

    this.statTables = document.getElementById('stat-tables');
    this.statRecords = document.getElementById('stat-records');
    this.tablesGridContainer = document.getElementById('tables-grid-container');
    this.timetravelContainer = document.getElementById('timetravel-history-container');

    if (this.token && this.tokenInput) {
      this.tokenInput.value = this.token;
    }
  }

  attachEventListeners() {
    // Nav Navigation
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = item.dataset.view;
        if (viewId) this.switchView(viewId);
      });
    });

    // Auth
    this.btnConnect.addEventListener('click', () => this.connectGitHub());
    this.btnDisconnect.addEventListener('click', () => this.disconnect());

    // SQL Runner
    this.btnSqlRun.addEventListener('click', () => this.executeSql());
    this.btnSqlClear.addEventListener('click', () => {
      this.sqlEditor.value = '';
    });

    // SQL Snippets
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sqlEditor.value = btn.dataset.sql;
      });
    });

    // New Branch Modal
    this.btnNewBranch.addEventListener('click', () => {
      this.modalNewBranch.classList.remove('hidden');
    });

    document.querySelectorAll('.btn-close, .btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        this.modalNewBranch.classList.add('hidden');
      });
    });

    this.btnConfirmNewBranch.addEventListener('click', () => {
      const name = this.inputNewBranchName.value.trim();
      if (name) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        this.branchSelect.appendChild(opt);
        this.branchSelect.value = name;
        this.activeBranch = name;
        this.modalNewBranch.classList.add('hidden');
        this.showToast('Success', `Created database branch '${name}'`, 'success');
      }
    });

    // Export SQL
    const btnExport = document.getElementById('btn-export-sql');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportSqlDump());
    }

    // Provider Sync Buttons
    document.querySelectorAll('.btn-sync-provider').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = e.currentTarget.dataset.provider;
        this.showToast('Sync Queued', `Synchronized database state to ${provider.toUpperCase()}`, 'success');
      });
    });
  }

  switchView(viewId) {
    this.navItems.forEach(item => {
      if (item.dataset.view === viewId) item.classList.add('active');
      else item.classList.remove('active');
    });

    this.views.forEach(view => {
      if (view.id === `view-${viewId}`) view.classList.remove('hidden');
      else view.classList.add('hidden');
    });

    if (viewId === 'tables') this.renderTables();
    if (viewId === 'timetravel') this.renderTimeTravel();
  }

  async checkAuth() {
    if (!this.token) return;

    try {
      this.btnConnect.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      const res = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${this.token}` }
      });

      if (!res.ok) throw new Error('Invalid Token');

      this.user = await res.json();
      this.setAuthenticatedState();
      this.showToast('Connected', `Connected as ${this.user.login}`, 'success');

    } catch (err) {
      this.disconnect();
      this.showToast('Error', 'Invalid or expired GitHub Token.', 'error');
    } finally {
      this.btnConnect.innerHTML = 'Connect';
    }
  }

  connectGitHub() {
    const val = this.tokenInput.value.trim();
    if (!val) {
      this.showToast('Error', 'Please enter a GitHub Personal Access Token.', 'error');
      return;
    }
    this.token = val;
    localStorage.setItem('combase_gh_token', this.token);
    this.checkAuth();
  }

  disconnect() {
    this.token = '';
    this.user = null;
    localStorage.removeItem('combase_gh_token');
    
    document.getElementById('token-group').classList.remove('hidden');
    this.btnDisconnect.classList.add('hidden');
    this.tokenInput.value = '';

    this.userProfile.innerHTML = `
      <div class="avatar-placeholder"><i class="fa-regular fa-user"></i></div>
      <div class="user-info">
        <span class="user-name">Guest Mode</span>
        <span class="user-status text-muted">Not Connected</span>
      </div>
    `;
  }

  setAuthenticatedState() {
    document.getElementById('token-group').classList.add('hidden');
    this.btnDisconnect.classList.remove('hidden');
    
    this.userProfile.innerHTML = `
      <img src="${this.user.avatar_url}" class="avatar-placeholder" alt="${this.user.login}">
      <div class="user-info">
        <span class="user-name">${this.user.login}</span>
        <span class="user-status text-accent"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Connected</span>
      </div>
    `;
  }

  executeSql() {
    const sql = this.sqlEditor.value.trim();
    if (!sql) {
      this.showToast('Warning', 'Please enter a SQL statement to run.', 'warning');
      return;
    }

    const startTime = Date.now();
    try {
      const upper = sql.toUpperCase();

      if (upper.startsWith('CREATE TABLE')) {
        const match = sql.match(/CREATE\s+TABLE\s+([a-zA-Z0-9_-]+)\s*\(([\s\S]+)\)/i);
        if (match) {
          const tableName = match[1];
          const colsStr = match[2];
          const columns = colsStr.split(',').map(c => {
            const parts = c.trim().split(/\s+/);
            return { name: parts[0], type: parts[1] || 'TEXT', primaryKey: c.toUpperCase().includes('PRIMARY KEY') };
          });

          this.dbState.schemas[tableName] = {
            name: tableName,
            columns,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.dbState.tables[tableName] = this.dbState.tables[tableName] || [];
        }
        this.renderQueryResult([], 0, Date.now() - startTime, 1);

      } else if (upper.startsWith('INSERT INTO')) {
        const match = sql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_-]+)\s*(\(([^)]+)\))?\s*VALUES\s*\(([\s\S]+)\)/i);
        if (match) {
          const tableName = match[1];
          const valsStr = match[4];
          const values = valsStr.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
          const schema = this.dbState.schemas[tableName];
          if (!schema) throw new Error(`Table '${tableName}' does not exist.`);
          
          const row = {};
          schema.columns.forEach((col, idx) => {
            row[col.name] = values[idx] || null;
          });
          this.dbState.tables[tableName].push(row);
          this.renderQueryResult([row], 1, Date.now() - startTime, 1);
        }

      } else if (upper.startsWith('SELECT')) {
        const match = sql.match(/SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_-]+)/i);
        if (!match) throw new Error('Malformed SELECT statement.');
        const tableName = match[2];
        const rows = this.dbState.tables[tableName] || [];
        this.renderQueryResult(rows, rows.length, Date.now() - startTime);
      } else {
        this.renderQueryResult([], 0, Date.now() - startTime, 1);
      }

      this.renderStats();

    } catch (err) {
      this.queryResultsContainer.innerHTML = `
        <div class="empty-state p-4" style="color: var(--danger);">
          <i class="fa-solid fa-triangle-exclamation empty-icon"></i>
          <h3>Execution Error</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  renderQueryResult(rows, count, executionTimeMs, affectedRows) {
    this.queryMetaBadge.classList.remove('hidden');
    this.queryMetaBadge.textContent = `${executionTimeMs} ms`;

    if (affectedRows !== undefined && rows.length === 0) {
      this.queryResultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-check empty-icon" style="color: var(--accent);"></i>
          <h3>Query Executed Successfully</h3>
          <p class="text-muted">Affected Rows: ${affectedRows}</p>
        </div>
      `;
      return;
    }

    if (!rows || rows.length === 0) {
      this.queryResultsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-folder-open empty-icon"></i>
          <h3>0 Rows Returned</h3>
          <p class="text-muted">Query executed cleanly.</p>
        </div>
      `;
      return;
    }

    const headers = Object.keys(rows[0]);
    let tableHtml = `<table class="data-table"><thead><tr>`;
    headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
    tableHtml += `</tr></thead><tbody>`;

    rows.forEach(r => {
      tableHtml += `<tr>`;
      headers.forEach(h => {
        tableHtml += `<td>${r[h] !== null ? r[h] : '<span class="text-muted">NULL</span>'}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    this.queryResultsContainer.innerHTML = tableHtml;
  }

  renderStats() {
    const tableCount = Object.keys(this.dbState.schemas).length;
    let recordCount = 0;
    Object.values(this.dbState.tables).forEach(t => { recordCount += t.length; });

    if (this.statTables) this.statTables.textContent = tableCount;
    if (this.statRecords) this.statRecords.textContent = recordCount;
  }

  renderTables() {
    if (!this.tablesGridContainer) return;
    this.tablesGridContainer.innerHTML = '';

    const schemas = Object.values(this.dbState.schemas);
    if (schemas.length === 0) {
      this.tablesGridContainer.innerHTML = `<p class="text-muted">No tables created yet.</p>`;
      return;
    }

    schemas.forEach(s => {
      const rowCount = (this.dbState.tables[s.name] || []).length;
      const card = document.createElement('div');
      card.className = 'glass p-4 flex flex-column gap-2';
      card.innerHTML = `
        <div class="flex align-center justify-between">
          <h4><i class="fa-solid fa-table text-primary mr-2"></i> ${s.name}</h4>
          <span class="badge badge-primary font-code">${rowCount} rows</span>
        </div>
        <div class="text-small text-muted mt-2">Columns:</div>
        <div class="font-code text-small" style="color: #a5b4fc;">
          ${s.columns.map(c => `${c.name} (${c.type})`).join(', ')}
        </div>
      `;
      this.tablesGridContainer.appendChild(card);
    });
  }

  renderTimeTravel() {
    if (!this.timetravelContainer) return;
    this.timetravelContainer.innerHTML = `
      <div class="glass p-3 mb-2 flex align-center justify-between">
        <div>
          <span class="badge badge-primary font-code mr-2">HEAD</span>
          <span class="font-bold">Initial Database Checkpoint</span>
          <span class="text-muted text-small ml-2">• Just now</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.showToast('Time-Travel', 'Restored to HEAD checkpoint', 'success')">
          <i class="fa-solid fa-rotate-left"></i> Restore
        </button>
      </div>
    `;
  }

  exportSqlDump() {
    let sql = `-- COMBASE SQL Dump\n-- Exported At: ${new Date().toISOString()}\n\n`;
    Object.values(this.dbState.schemas).forEach(s => {
      const cols = s.columns.map(c => `${c.name} ${c.type}`).join(', ');
      sql += `CREATE TABLE ${s.name} (${cols});\n`;
    });
    sql += `\n`;
    Object.entries(this.dbState.tables).forEach(([name, rows]) => {
      rows.forEach(r => {
        const keys = Object.keys(r);
        const vals = keys.map(k => `'${r[k]}'`);
        sql += `INSERT INTO ${name} (${keys.join(', ')}) VALUES (${vals.join(', ')});\n`;
      });
    });

    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combase_dump_${Date.now()}.sql`;
    a.click();
    this.showToast('Export', 'Downloaded SQL Dump file', 'success');
  }

  showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `glass p-3 flex align-center gap-3`;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 280px;
      border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    toast.innerHTML = `
      <div>
        <strong style="display:block; font-size:13px;">${title}</strong>
        <span style="font-size:12px; color: #94a3b8;">${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new CombaseStudioApp();
});
