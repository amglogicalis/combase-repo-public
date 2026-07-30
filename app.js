class CombaseStudioApp {
  constructor() {
    this.token = localStorage.getItem('combase_gh_token') || '';
    this.activeDb = 'default_db';
    this.activeBranch = 'main';
    this.user = null;
    this.currentRenameTable = null;

    // Multi-Database State Store (Pre-populated demo tables)
    this.databases = {
      default_db: {
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
          },
          products: {
            name: 'products',
            columns: [
              { name: 'id', type: 'INTEGER', primaryKey: true },
              { name: 'title', type: 'TEXT' },
              { name: 'price', type: 'REAL' },
              { name: 'category', type: 'TEXT' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          orders: {
            name: 'orders',
            columns: [
              { name: 'order_id', type: 'INTEGER', primaryKey: true },
              { name: 'user_id', type: 'INTEGER' },
              { name: 'total_amount', type: 'REAL' },
              { name: 'status', type: 'TEXT' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          system_logs: {
            name: 'system_logs',
            columns: [
              { name: 'id', type: 'INTEGER', primaryKey: true },
              { name: 'event', type: 'TEXT' },
              { name: 'level', type: 'TEXT' },
              { name: 'timestamp', type: 'DATETIME' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        tables: {
          users: [
            { id: 1, name: 'Adrián', email: 'adrian@terra.org', role: 'Admin' },
            { id: 2, name: 'Combase Bot', email: 'bot@terra.org', role: 'System Engine' },
            { id: 3, name: 'Elena García', email: 'elena@terra.org', role: 'Developer' }
          ],
          products: [
            { id: 101, title: 'Terra AI Serverless Runner', price: 0.00, category: 'Compute' },
            { id: 102, title: 'Rolla Storage Vault 1TB', price: 0.00, category: 'Storage' },
            { id: 103, title: 'Webbl CDN Global Edge', price: 0.00, category: 'Hosting' }
          ],
          orders: [
            { order_id: 5001, user_id: 1, total_amount: 0.00, status: 'COMPLETED' },
            { order_id: 5002, user_id: 3, total_amount: 0.00, status: 'PROCESSING' }
          ],
          system_logs: [
            { id: 1, event: 'COMBASE Initialized', level: 'INFO', timestamp: new Date().toISOString() },
            { id: 2, event: 'Zero-Copy Checkpoint Created', level: 'INFO', timestamp: new Date().toISOString() }
          ]
        }
      }
    };

    this.initElements();
    this.attachEventListeners();
    this.checkAuth();
    this.updateDbState();
  }

  get dbState() {
    if (!this.databases[this.activeDb]) {
      this.databases[this.activeDb] = { schemas: {}, tables: {} };
    }
    return this.databases[this.activeDb];
  }

  initElements() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.views = document.querySelectorAll('.view-content');
    
    this.tokenInput = document.getElementById('gh-token');
    this.btnConnect = document.getElementById('btn-connect');
    this.btnDisconnect = document.getElementById('btn-disconnect');
    this.userProfile = document.getElementById('user-profile');
    
    this.dbSelect = document.getElementById('db-select');
    this.btnOpenNewDb = document.getElementById('btn-open-new-db');
    this.modalNewDb = document.getElementById('modal-new-db');
    this.btnConfirmNewDb = document.getElementById('btn-confirm-new-db');
    this.inputNewDbName = document.getElementById('input-new-db-name');

    this.branchSelect = document.getElementById('branch-select');
    this.btnOpenNewBranch = document.getElementById('btn-open-new-branch');
    this.modalNewBranch = document.getElementById('modal-new-branch');
    this.btnConfirmNewBranch = document.getElementById('btn-confirm-new-branch');
    this.inputNewBranchName = document.getElementById('input-new-branch-name');

    this.statActiveDb = document.getElementById('stat-active-db');
    this.statTables = document.getElementById('stat-tables');
    this.statRecords = document.getElementById('stat-records');

    this.schemaTreeList = document.getElementById('schema-tree-list');
    this.sqlEditor = document.getElementById('sql-editor');
    this.btnSqlRun = document.getElementById('btn-sql-run');
    this.btnSqlClear = document.getElementById('btn-sql-clear');
    this.queryResultsContainer = document.getElementById('query-results-container');
    this.queryMetaBadge = document.getElementById('query-meta-badge');

    this.tablesCardsGrid = document.getElementById('tables-cards-grid');
    this.btnOpenCreateTableModal = document.getElementById('btn-open-create-table-modal');
    this.modalCreateTable = document.getElementById('modal-create-table');
    this.btnConfirmCreateTable = document.getElementById('btn-confirm-create-table');

    this.modalRenameTable = document.getElementById('modal-rename-table');
    this.renameTableOldName = document.getElementById('rename-table-old-name');
    this.inputRenameTableNew = document.getElementById('input-rename-table-new');
    this.btnConfirmRenameTable = document.getElementById('btn-confirm-rename-table');

    this.modalInspectTable = document.getElementById('modal-inspect-table');
    this.inspectTableTitle = document.getElementById('inspect-table-title');
    this.inspectTableSubtitle = document.getElementById('inspect-table-subtitle');
    this.inspectTableGrid = document.getElementById('inspect-table-grid');
    this.btnInspectInsertRow = document.getElementById('btn-inspect-insert-row');

    this.modalCustomConfirm = document.getElementById('modal-custom-confirm');
    this.confirmModalTitle = document.getElementById('confirm-modal-title');
    this.confirmModalMessage = document.getElementById('confirm-modal-message');
    this.btnConfirmOk = document.getElementById('btn-confirm-ok');
    this.btnConfirmCancel = document.getElementById('btn-confirm-cancel');

    this.modalCodeGen = document.getElementById('modal-code-generator');
    this.codeGenTitle = document.getElementById('code-gen-title');
    this.codeGenOutput = document.getElementById('code-gen-output');
    this.btnCopyGeneratedCode = document.getElementById('btn-copy-generated-code');

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

    // DB Switcher
    this.dbSelect.addEventListener('change', (e) => {
      this.activeDb = e.target.value;
      this.updateDbState();
      this.showToast('Database Switched', `Active DB: ${this.activeDb}`, 'info');
    });

    this.btnOpenNewDb.addEventListener('click', () => this.modalNewDb.classList.remove('hidden'));
    this.btnConfirmNewDb.addEventListener('click', () => {
      const dbName = this.inputNewDbName.value.trim();
      if (dbName) {
        if (!this.databases[dbName]) {
          this.databases[dbName] = { schemas: {}, tables: {} };
          const opt = document.createElement('option');
          opt.value = dbName;
          opt.textContent = dbName;
          this.dbSelect.appendChild(opt);
        }
        this.dbSelect.value = dbName;
        this.activeDb = dbName;
        this.inputNewDbName.value = '';
        this.modalNewDb.classList.add('hidden');
        this.updateDbState();
        this.showToast('Success', `Database '${dbName}' created`, 'success');
      }
    });

    // Branch Switcher
    this.btnOpenNewBranch.addEventListener('click', () => this.modalNewBranch.classList.remove('hidden'));
    this.btnConfirmNewBranch.addEventListener('click', () => {
      const branchName = this.inputNewBranchName.value.trim();
      if (branchName) {
        const opt = document.createElement('option');
        opt.value = branchName;
        opt.textContent = branchName;
        this.branchSelect.appendChild(opt);
        this.branchSelect.value = branchName;
        this.activeBranch = branchName;
        this.inputNewBranchName.value = '';
        this.modalNewBranch.classList.add('hidden');
        this.showToast('Branch Created', `Branch '${branchName}' active`, 'success');
      }
    });

    // SQL Runner
    this.btnSqlRun.addEventListener('click', () => this.executeSql());
    this.btnSqlClear.addEventListener('click', () => { this.sqlEditor.value = ''; });

    this.sqlEditor.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.executeSql();
      }
    });

    // Table Explorer Actions
    if (this.btnOpenCreateTableModal) {
      this.btnOpenCreateTableModal.addEventListener('click', () => this.modalCreateTable.classList.remove('hidden'));
    }

    this.btnConfirmCreateTable.addEventListener('click', () => {
      const name = document.getElementById('input-table-name').value.trim();
      const cols = document.getElementById('input-table-cols').value.trim();
      if (name && cols) {
        const sql = `CREATE TABLE ${name} (${cols});`;
        this.sqlEditor.value = sql;
        this.executeSql();
        this.modalCreateTable.classList.add('hidden');
      }
    });

    this.btnConfirmRenameTable.addEventListener('click', () => {
      const newName = this.inputRenameTableNew.value.trim();
      if (this.currentRenameTable && newName) {
        const sql = `ALTER TABLE ${this.currentRenameTable} RENAME TO ${newName};`;
        this.sqlEditor.value = sql;
        this.executeSql();
        this.modalRenameTable.classList.add('hidden');
        this.showToast('Renamed', `Table renamed to '${newName}'`, 'success');
      }
    });

    // Modal Close buttons
    document.querySelectorAll('.btn-close, .btn-cancel').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Provider Bridge Generation
    document.querySelectorAll('.btn-bridge-generate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = e.currentTarget.dataset.provider;
        this.generateProviderScript(provider);
      });
    });

    this.btnCopyGeneratedCode.addEventListener('click', () => {
      navigator.clipboard.writeText(this.codeGenOutput.value);
      this.showToast('Copied', 'Script copied to clipboard', 'success');
    });

    // SQL Dump Export
    document.getElementById('btn-export-sql').addEventListener('click', () => this.exportSqlDump());

    // Drag and Drop SQL File Import
    const dropZone = document.getElementById('drop-zone-sql');
    const fileInput = document.getElementById('import-sql-file');
    const btnTriggerImport = document.getElementById('btn-trigger-import-sql');

    if (btnTriggerImport && fileInput) {
      btnTriggerImport.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) this.handleSqlFileInput(e.target.files[0]);
      });
    }

    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drop-zone-active'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone-active'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');
        if (e.dataTransfer.files.length) this.handleSqlFileInput(e.dataTransfer.files[0]);
      });
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
  }

  showConfirmModal(title, message, onConfirm) {
    this.confirmModalTitle.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-teal mr-2"></i> ${title}`;
    this.confirmModalMessage.textContent = message;
    
    this.btnConfirmOk.onclick = () => {
      this.modalCustomConfirm.classList.add('hidden');
      onConfirm();
    };

    this.modalCustomConfirm.classList.remove('hidden');
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

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid Token');
        }
      }

      this.user = await res.json();
      this.setAuthenticatedState();

    } catch (err) {
      if (err.message === 'Invalid Token') {
        this.disconnect();
        this.showToast('Error', 'Invalid or expired GitHub PAT.', 'error');
      }
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
        <span class="user-status text-muted">Standalone Local</span>
      </div>
    `;
  }

  setAuthenticatedState() {
    document.getElementById('token-group').classList.add('hidden');
    this.btnDisconnect.classList.remove('hidden');
    if (this.tokenInput) this.tokenInput.value = this.token;
    
    this.userProfile.innerHTML = `
      <img src="${this.user.avatar_url}" class="avatar-placeholder" alt="${this.user.login}">
      <div class="user-info">
        <span class="user-name">${this.user.login}</span>
        <span class="user-status text-accent"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Connected</span>
      </div>
    `;
  }

  updateDbState() {
    if (this.statActiveDb) this.statActiveDb.textContent = this.activeDb;
    const schemas = Object.values(this.dbState.schemas);
    const tableCount = schemas.length;
    let recordCount = 0;
    Object.values(this.dbState.tables).forEach(t => { recordCount += t.length; });

    if (this.statTables) this.statTables.textContent = tableCount;
    if (this.statRecords) this.statRecords.textContent = recordCount;

    this.renderSchemaTree();
    this.renderTables();
  }

  renderSchemaTree() {
    if (!this.schemaTreeList) return;
    this.schemaTreeList.innerHTML = '';

    const schemas = Object.values(this.dbState.schemas);
    if (schemas.length === 0) {
      this.schemaTreeList.innerHTML = `<p class="text-small text-muted p-2">No tables found.</p>`;
      return;
    }

    schemas.forEach(s => {
      const rowCount = (this.dbState.tables[s.name] || []).length;
      const item = document.createElement('div');
      item.className = 'schema-tree-item';
      item.innerHTML = `
        <span><i class="fa-solid fa-table text-teal mr-2"></i> ${s.name}</span>
        <span class="badge badge-teal font-code">${rowCount}</span>
      `;
      item.addEventListener('click', () => {
        this.sqlEditor.value = `SELECT * FROM ${s.name};`;
        this.executeSql();
      });
      this.schemaTreeList.appendChild(item);
    });
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

      } else if (upper.startsWith('ALTER TABLE')) {
        const match = sql.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_-]+)\s+RENAME\s+TO\s+([a-zA-Z0-9_-]+)/i);
        if (match) {
          const oldName = match[1];
          const newName = match[2];
          if (this.dbState.schemas[oldName]) {
            this.dbState.schemas[newName] = { ...this.dbState.schemas[oldName], name: newName };
            delete this.dbState.schemas[oldName];
            this.dbState.tables[newName] = this.dbState.tables[oldName] || [];
            delete this.dbState.tables[oldName];
          }
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
        const match = sql.match(/SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_-]+)(\s+WHERE\s+([\s\S]+?))?/i);
        if (!match) throw new Error('Malformed SELECT statement.');
        const tableName = match[2];
        const whereClause = match[4];
        let rows = this.dbState.tables[tableName] || [];
        
        if (whereClause) {
          const parts = whereClause.split('=').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          if (parts.length === 2) {
            rows = rows.filter(r => String(r[parts[0]]) === String(parts[1]));
          }
        }

        this.renderQueryResult(rows, rows.length, Date.now() - startTime);

      } else if (upper.startsWith('DROP TABLE')) {
        const match = sql.match(/DROP\s+TABLE\s+([a-zA-Z0-9_-]+)/i);
        if (match) {
          const tableName = match[1];
          delete this.dbState.schemas[tableName];
          delete this.dbState.tables[tableName];
          this.renderQueryResult([], 0, Date.now() - startTime, 1);
        }

      } else {
        this.renderQueryResult([], 0, Date.now() - startTime, 1);
      }

      this.updateDbState();

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
        tableHtml += `<td>${r[h] !== null && r[h] !== undefined ? r[h] : '<span class="text-muted">NULL</span>'}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;
    this.queryResultsContainer.innerHTML = tableHtml;
  }

  renderTables() {
    if (!this.tablesCardsGrid) return;
    this.tablesCardsGrid.innerHTML = '';

    const schemas = Object.values(this.dbState.schemas);
    if (schemas.length === 0) {
      this.tablesCardsGrid.innerHTML = `<div class="empty-state glass p-5" style="grid-column:1/-1;"><i class="fa-solid fa-table-cells empty-icon"></i><h3>No Tables Created</h3><p class="text-muted">Click "Create Table" to define your first schema.</p></div>`;
      return;
    }

    schemas.forEach(s => {
      const rows = this.dbState.tables[s.name] || [];
      const card = document.createElement('div');
      card.className = 'table-card glass';
      card.innerHTML = `
        <div class="table-card-header">
          <h4><i class="fa-solid fa-table text-teal mr-2"></i> ${s.name}</h4>
          <span class="badge badge-teal font-code">${rows.length} rows</span>
        </div>
        
        <div class="text-small text-muted mt-1">Columns:</div>
        <div class="font-code text-small" style="color: #2dd4bf;">
          ${s.columns.map(c => `${c.name} (${c.type})`).join(', ')}
        </div>

        <div class="flex gap-2 mt-3 flex-wrap">
          <button class="btn btn-primary btn-sm flex-1" onclick="app.inspectTable('${s.name}')">
            <i class="fa-solid fa-eye"></i> Open Table
          </button>
          <button class="btn btn-secondary btn-sm" onclick="app.openRenameModal('${s.name}')" title="Rename Table">
            <i class="fa-solid fa-pen"></i> Rename
          </button>
          <button class="btn btn-danger-outline btn-sm" onclick="app.dropTable('${s.name}')" title="Drop Table">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
      this.tablesCardsGrid.appendChild(card);
    });
  }

  openRenameModal(tableName) {
    this.currentRenameTable = tableName;
    this.renameTableOldName.textContent = tableName;
    this.inputRenameTableNew.value = tableName;
    this.modalRenameTable.classList.remove('hidden');
  }

  inspectTable(tableName) {
    const schema = this.dbState.schemas[tableName];
    const rows = this.dbState.tables[tableName] || [];
    if (!schema) return;

    this.inspectTableTitle.innerHTML = `<i class="fa-solid fa-table text-teal mr-2"></i> Inspecting Table: ${tableName}`;
    this.inspectTableSubtitle.textContent = `${rows.length} total rows in ${this.activeDb}`;
    
    if (rows.length === 0) {
      this.inspectTableGrid.innerHTML = `<div class="p-4 text-center text-muted">Table '${tableName}' is empty.</div>`;
    } else {
      const headers = schema.columns.map(c => c.name);
      let html = `<table class="data-table"><thead><tr>`;
      headers.forEach(h => { html += `<th>${h}</th>`; });
      html += `<th style="text-align:right;">Actions</th></tr></thead><tbody>`;

      rows.forEach((r, idx) => {
        html += `<tr>`;
        headers.forEach(h => {
          html += `<td>${r[h] !== null && r[h] !== undefined ? r[h] : '<span class="text-muted">NULL</span>'}</td>`;
        });
        html += `<td style="text-align:right;"><button class="btn btn-danger-outline btn-xs" onclick="app.deleteRow('${tableName}', ${idx})"><i class="fa-solid fa-trash"></i></button></td>`;
        html += `</tr>`;
      });
      html += `</tbody></table>`;
      this.inspectTableGrid.innerHTML = html;
    }

    this.btnInspectInsertRow.onclick = () => {
      const sampleVals = schema.columns.map(c => `'sample_${c.name}'`).join(', ');
      this.sqlEditor.value = `INSERT INTO ${tableName} VALUES (${sampleVals});`;
      this.closeAllModals();
      this.switchView('studio');
    };

    this.modalInspectTable.classList.remove('hidden');
  }

  deleteRow(tableName, rowIndex) {
    if (this.dbState.tables[tableName]) {
      this.dbState.tables[tableName].splice(rowIndex, 1);
      this.updateDbState();
      this.inspectTable(tableName);
      this.showToast('Row Deleted', `Deleted row at index ${rowIndex} from ${tableName}`, 'success');
    }
  }

  dropTable(tableName) {
    this.showConfirmModal(
      'Drop Table Warning',
      `Are you sure you want to DROP table '${tableName}'? All records will be permanently deleted.`,
      () => {
        this.sqlEditor.value = `DROP TABLE ${tableName};`;
        this.executeSql();
        this.showToast('Dropped', `Table '${tableName}' dropped.`, 'success');
      }
    );
  }

  renderTimeTravel() {
    if (!this.timetravelContainer) return;
    this.timetravelContainer.innerHTML = `
      <div class="glass p-4 flex align-center justify-between">
        <div>
          <span class="badge badge-teal font-code mr-2">HEAD</span>
          <span class="font-bold">Initial Database Checkpoint</span>
          <span class="text-muted text-small ml-2">• Just now</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.showToast('Time-Travel', 'Restored to HEAD checkpoint', 'success')">
          <i class="fa-solid fa-rotate-left"></i> Restore
        </button>
      </div>
    `;
  }

  generateProviderScript(provider) {
    let script = `-- COMBASE Provider Bridge Export for ${provider.toUpperCase()}\n-- Generated At: ${new Date().toISOString()}\n\n`;

    if (provider === 'postgres') {
      this.codeGenTitle.innerHTML = `<i class="fa-solid fa-database text-teal mr-2"></i> PostgreSQL DDL Migration Script`;
      Object.values(this.dbState.schemas).forEach(s => {
        const colDefs = s.columns.map(c => `${c.name} ${c.type === 'INTEGER' ? 'SERIAL' : c.type}${c.primaryKey ? ' PRIMARY KEY' : ''}`).join(', ');
        script += `CREATE TABLE ${s.name} (${colDefs});\n`;
      });
      script += `\n`;
      Object.entries(this.dbState.tables).forEach(([name, rows]) => {
        rows.forEach(r => {
          const keys = Object.keys(r);
          const vals = keys.map(k => `'${r[k]}'`);
          script += `INSERT INTO ${name} (${keys.join(', ')}) VALUES (${vals.join(', ')});\n`;
        });
      });

    } else if (provider === 'dynamodb') {
      this.codeGenTitle.innerHTML = `<i class="fa-brands fa-aws text-teal mr-2"></i> DynamoDB JSON Document Payload`;
      const dynamoData = {};
      Object.entries(this.dbState.tables).forEach(([name, rows]) => {
        dynamoData[name] = rows.map(r => {
          const item = {};
          Object.keys(r).forEach(k => {
            item[k] = { S: String(r[k]) };
          });
          return { PutRequest: { Item: item } };
        });
      });
      script = JSON.stringify(dynamoData, null, 2);

    } else if (provider === 'rolla') {
      this.codeGenTitle.innerHTML = `<i class="fa-solid fa-box-archive text-teal mr-2"></i> Rolla-Ball Parquet Snapshot`;
      script = JSON.stringify(this.dbState, null, 2);
    }

    this.codeGenOutput.value = script;
    this.modalCodeGen.classList.remove('hidden');
  }

  exportSqlDump() {
    let sql = `-- COMBASE SQL Dump\n-- Database: ${this.activeDb}\n-- Exported At: ${new Date().toISOString()}\n\n`;
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
    a.download = `combase_${this.activeDb}_dump_${Date.now()}.sql`;
    a.click();
    this.showToast('Export Completed', `Downloaded SQL Dump for '${this.activeDb}'`, 'success');
  }

  handleSqlFileInput(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      this.sqlEditor.value = content;
      this.switchView('studio');
      this.showToast('File Loaded', `Loaded '${file.name}' into SQL Editor. Click 'Run Query' to execute.`, 'info');
    };
    reader.readAsText(file);
  }

  showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `glass p-3 flex align-center gap-3`;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 280px;
      border-left: 4px solid ${type === 'success' ? '#14b8a6' : type === 'error' ? '#ef4444' : '#015d51'};
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    toast.innerHTML = `
      <div>
        <strong style="display:block; font-size:13px; color: #fff;">${title}</strong>
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
