class CombaseStudioApp {
  constructor() {
    this.token = localStorage.getItem('combase_gh_token') || '';
    this.activeDb = 'default_db';
    this.activeBranch = 'main';
    this.user = null;
    this.currentRenameTable = null;
    this.currentInspectTable = null;
    this.vaultFileSha = null;

    // Dynamic Time-Travel Commit Checkpoints History
    this.commitHistory = [];

    // Initial Demo Database Template
    this.defaultDatabases = {
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

    this.databases = JSON.parse(JSON.stringify(this.defaultDatabases));

    this.initElements();
    this.attachEventListeners();

    if (this.token) {
      this.checkAuth();
    } else {
      this.showLockScreen();
    }
  }

  get dbState() {
    if (!this.databases[this.activeDb]) {
      this.databases[this.activeDb] = { schemas: {}, tables: {} };
    }
    return this.databases[this.activeDb];
  }

  showLockScreen() {
    this.token = null;
    this.user = null;
    this.vaultFileSha = null;
    localStorage.removeItem('combase_gh_token');

    // Reset Databases
    this.databases = JSON.parse(JSON.stringify(this.defaultDatabases));
    this.commitHistory = [];

    document.getElementById('view-auth-required').classList.remove('hidden');
    document.getElementById('authenticated-content').classList.add('hidden');
    document.getElementById('token-group').classList.remove('hidden');
    document.getElementById('btn-disconnect').classList.add('hidden');

    this.navItems.forEach(item => item.classList.add('disabled'));

    this.userProfile.innerHTML = `
      <div class="avatar-placeholder"><i class="fa-regular fa-user"></i></div>
      <div class="user-info">
        <span class="user-name">Guest Mode</span>
        <span class="user-status text-danger"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Disconnected</span>
      </div>
    `;

    this.updateDbState();
  }

  showAuthenticatedScreen() {
    document.getElementById('view-auth-required').classList.add('hidden');
    document.getElementById('authenticated-content').classList.remove('hidden');
    document.getElementById('token-group').classList.add('hidden');
    document.getElementById('btn-disconnect').classList.remove('hidden');

    this.navItems.forEach(item => item.classList.remove('disabled'));

    this.userProfile.innerHTML = `
      <img src="${this.user.avatar_url}" class="avatar-placeholder" alt="${this.user.login}">
      <div class="user-info">
        <span class="user-name">${this.user.login}</span>
        <span class="user-status text-accent"><i class="fa-solid fa-circle" style="font-size:8px;"></i> Connected</span>
      </div>
    `;
  }

  async persistCurrentState(commitMsg = 'Database update') {
    if (this.token && this.user) {
      await this.pushToGitHubVault(commitMsg);
    }
  }

  async pushToGitHubVault(commitMsg) {
    try {
      const owner = this.user.login;
      const repo = '.combase-storage';
      const path = 'db.json';

      // Convert content to utf-8 base64
      const jsonStr = JSON.stringify(this.databases, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));

      // Get current file SHA if not cached
      if (!this.vaultFileSha) {
        const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${this.activeBranch}`, {
          headers: { 'Authorization': `token ${this.token}` }
        });
        if (getRes.ok) {
          const fileData = await getRes.json();
          this.vaultFileSha = fileData.sha;
        }
      }

      const body = {
        message: `combase: ${commitMsg}`,
        content: contentBase64,
        branch: this.activeBranch
      };
      if (this.vaultFileSha) body.sha = this.vaultFileSha;

      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        const resData = await putRes.json();
        this.vaultFileSha = resData.content.sha;
        const commitSha = resData.commit.sha.substring(0, 7);

        this.commitHistory.unshift({
          sha: commitSha,
          message: commitMsg,
          timestamp: new Date().toISOString(),
          snapshot: JSON.parse(JSON.stringify(this.databases))
        });
        this.renderTimeTravel();
        this.showToast('Git Vault Synced', `Committed to .combase-storage (${commitSha})`, 'success');
      }
    } catch (err) {
      console.warn('GitHub Vault sync warning:', err);
    }
  }

  async loadFromGitHubVault() {
    if (!this.token || !this.user) return;

    try {
      const owner = this.user.login;
      const repo = '.combase-storage';
      const path = 'db.json';

      // 1. Check if repo exists; if 404 create it
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'Authorization': `token ${this.token}` }
      });

      if (repoCheck.status === 404) {
        // Create private repo
        await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: repo, private: true, auto_init: true })
        });

        // Initialize with default demo tables
        this.databases = JSON.parse(JSON.stringify(this.defaultDatabases));
        await this.pushToGitHubVault('Initialize COMBASE storage vault');
        this.showToast('Storage Initialized', 'Created private .combase-storage repo', 'info');
        return;
      }

      // 2. Fetch db.json
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${this.activeBranch}`, {
        headers: { 'Authorization': `token ${this.token}` }
      });

      if (res.ok) {
        const fileData = await res.json();
        this.vaultFileSha = fileData.sha;
        const decodedStr = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
        const remoteData = JSON.parse(decodedStr);

        this.databases = remoteData;
        this.updateDbState();
        this.showToast('Vault Loaded', 'Database loaded from GitHub .combase-storage!', 'success');
      } else {
        // If file doesn't exist yet, push default tables
        this.databases = JSON.parse(JSON.stringify(this.defaultDatabases));
        await this.pushToGitHubVault('Initialize default database schema');
      }

      // 3. Fetch Commit History
      const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${this.activeBranch}`, {
        headers: { 'Authorization': `token ${this.token}` }
      });
      if (commitsRes.ok) {
        const commitsList = await commitsRes.json();
        this.commitHistory = commitsList.slice(0, 15).map(c => ({
          sha: c.sha.substring(0, 7),
          message: c.commit.message,
          timestamp: c.commit.author.date,
          snapshot: JSON.parse(JSON.stringify(this.databases))
        }));
        this.renderTimeTravel();
      }

    } catch (err) {
      console.warn('Vault load error:', err);
    }
  }

  initElements() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.views = document.querySelectorAll('.view-content');
    
    this.tokenInput = document.getElementById('gh-token');
    this.btnConnect = document.getElementById('btn-connect');
    this.btnDisconnect = document.getElementById('btn-disconnect');
    this.userProfile = document.getElementById('user-profile');
    
    this.authGateToken = document.getElementById('auth-gate-token');
    this.btnAuthGateConnect = document.getElementById('btn-auth-gate-connect');

    this.dbSelect = document.getElementById('db-select');
    this.btnOpenNewDb = document.getElementById('btn-open-new-db');
    this.btnDeleteActiveDb = document.getElementById('btn-delete-active-db');
    this.modalNewDb = document.getElementById('modal-new-db');
    this.btnConfirmNewDb = document.getElementById('btn-confirm-new-db');
    this.inputNewDbName = document.getElementById('input-new-db-name');

    this.branchSelect = document.getElementById('branch-select');
    this.btnOpenNewBranch = document.getElementById('btn-open-new-branch');
    this.btnDeleteActiveBranch = document.getElementById('btn-delete-active-branch');
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
    this.btnInspectAddInlineRow = document.getElementById('btn-inspect-add-inline-row');
    this.btnInspectManageSchema = document.getElementById('btn-inspect-manage-schema');

    this.modalManageColumns = document.getElementById('modal-manage-columns');
    this.modalColumnsList = document.getElementById('modal-columns-list');
    this.btnModalAddCol = document.getElementById('btn-modal-add-col');
    this.btnConfirmSaveSchema = document.getElementById('btn-confirm-save-schema');

    this.modalCustomConfirm = document.getElementById('modal-custom-confirm');
    this.confirmModalTitle = document.getElementById('confirm-modal-title');
    this.confirmModalMessage = document.getElementById('confirm-modal-message');
    this.btnConfirmOk = document.getElementById('btn-confirm-ok');
    this.btnConfirmCancel = document.getElementById('btn-confirm-cancel');

    this.modalCodeGen = document.getElementById('modal-code-generator');
    this.codeGenTitle = document.getElementById('code-gen-title');
    this.codeGenOutput = document.getElementById('code-gen-output');
    this.btnCopyGeneratedCode = document.getElementById('btn-copy-generated-code');

    this.btnImportProviderData = document.getElementById('btn-import-provider-data');
    this.importProviderType = document.getElementById('import-provider-type');
    this.importProviderTextarea = document.getElementById('import-provider-textarea');

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
        if (item.classList.contains('disabled')) return;
        const viewId = item.dataset.view;
        if (viewId) this.switchView(viewId);
      });
    });

    // Auth
    this.btnConnect.addEventListener('click', () => this.connectGitHub());
    this.btnDisconnect.addEventListener('click', () => this.disconnect());

    if (this.btnAuthGateConnect) {
      this.btnAuthGateConnect.addEventListener('click', () => {
        const val = this.authGateToken.value.trim();
        if (val) {
          this.tokenInput.value = val;
          this.connectGitHub();
        } else {
          this.showToast('Error', 'Please enter a GitHub PAT token.', 'error');
        }
      });
    }

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
        this.persistCurrentState(`Created Database '${dbName}'`);
        this.updateDbState();
        this.showToast('Success', `Database '${dbName}' created`, 'success');
      }
    });

    // Delete Active DB
    if (this.btnDeleteActiveDb) {
      this.btnDeleteActiveDb.addEventListener('click', () => {
        if (this.activeDb === 'default_db' && Object.keys(this.databases).length === 1) {
          this.showToast('Error', 'Cannot delete default_db when it is the only database.', 'error');
          return;
        }
        this.showConfirmModal(
          'Delete Database Warning',
          `Are you sure you want to delete database '${this.activeDb}' and all its tables?`,
          () => {
            delete this.databases[this.activeDb];
            const remainingDbs = Object.keys(this.databases);
            this.activeDb = remainingDbs[0] || 'default_db';
            if (!this.databases[this.activeDb]) {
              this.databases[this.activeDb] = { schemas: {}, tables: {} };
            }
            this.renderDbDropdown();
            this.persistCurrentState(`Deleted Database '${this.activeDb}'`);
            this.updateDbState();
            this.showToast('Deleted', `Database deleted. Active DB: ${this.activeDb}`, 'success');
          }
        );
      });
    }

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
        this.persistCurrentState(`Created Branch '${branchName}'`);
        this.showToast('Branch Created', `Branch '${branchName}' active`, 'success');
      }
    });

    // Delete Active Branch
    if (this.btnDeleteActiveBranch) {
      this.btnDeleteActiveBranch.addEventListener('click', () => {
        if (this.activeBranch === 'main') {
          this.showToast('Error', 'Cannot delete main branch.', 'error');
          return;
        }
        this.showConfirmModal(
          'Delete Branch Warning',
          `Are you sure you want to delete database branch '${this.activeBranch}'?`,
          () => {
            const deleted = this.activeBranch;
            const opt = this.branchSelect.querySelector(`option[value="${deleted}"]`);
            if (opt) opt.remove();
            this.activeBranch = 'main';
            this.branchSelect.value = 'main';
            this.showToast('Branch Deleted', `Deleted branch '${deleted}'. Switched to main.`, 'success');
          }
        );
      });
    }

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

    // Visual Schema Manager
    if (this.btnInspectManageSchema) {
      this.btnInspectManageSchema.addEventListener('click', () => {
        if (this.currentInspectTable) this.openManageSchemaModal(this.currentInspectTable);
      });
    }

    if (this.btnModalAddCol) {
      this.btnModalAddCol.addEventListener('click', () => this.appendColumnRow('', 'TEXT'));
    }

    if (this.btnConfirmSaveSchema) {
      this.btnConfirmSaveSchema.addEventListener('click', () => this.saveSchemaChanges());
    }

    // Bi-directional Provider Import
    if (this.btnImportProviderData) {
      this.btnImportProviderData.addEventListener('click', () => this.importExternalProviderData());
    }

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

  renderDbDropdown() {
    if (!this.dbSelect) return;
    this.dbSelect.innerHTML = '';
    Object.keys(this.databases).forEach(dbName => {
      const opt = document.createElement('option');
      opt.value = dbName;
      opt.textContent = dbName;
      this.dbSelect.appendChild(opt);
    });
    this.dbSelect.value = this.activeDb;
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => {
      m.classList.add('hidden');
      m.classList.remove('z-top');
    });
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
        throw new Error('Invalid Token');
      }

      this.user = await res.json();
      localStorage.setItem('combase_gh_token', this.token);
      this.showAuthenticatedScreen();
      await this.loadFromGitHubVault();

    } catch (err) {
      this.showLockScreen();
      this.showToast('Authentication Failed', 'Invalid or expired GitHub PAT Token.', 'error');
    } finally {
      this.btnConnect.innerHTML = 'Connect';
    }
  }

  connectGitHub() {
    const val = this.tokenInput.value.trim() || (this.authGateToken ? this.authGateToken.value.trim() : '');
    if (!val) {
      this.showToast('Error', 'Please enter a GitHub Personal Access Token.', 'error');
      return;
    }
    this.token = val;
    this.checkAuth();
  }

  disconnect() {
    this.showLockScreen();
    this.showToast('Disconnected', 'Session terminated. Access restricted.', 'info');
  }

  updateDbState() {
    if (this.statActiveDb) this.statActiveDb.textContent = this.activeDb;
    const schemas = Object.values(this.dbState.schemas);
    const tableCount = schemas.length;
    let recordCount = 0;
    Object.values(this.dbState.tables).forEach(t => { recordCount += t.length; });

    if (this.statTables) this.statTables.textContent = tableCount;
    if (this.statRecords) this.statRecords.textContent = recordCount;

    this.renderDbDropdown();
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
          this.persistCurrentState(`SQL: CREATE TABLE ${tableName}`);
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
            this.persistCurrentState(`SQL: RENAME ${oldName} -> ${newName}`);
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
          this.persistCurrentState(`SQL: INSERT INTO ${tableName}`);
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
          this.persistCurrentState(`SQL: DROP TABLE ${tableName}`);
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
      this.tablesCardsGrid.innerHTML = `<div class="empty-state glass p-5" style="grid-column:1/-1;"><i class="fa-solid fa-table-cells empty-icon"></i><h3>No Tables Found</h3><p class="text-muted">Click "Create Table" to define your first schema.</p></div>`;
      return;
    }

    schemas.forEach(s => {
      const rows = this.dbState.tables[s.name] || [];
      const card = document.createElement('div');
      card.className = 'table-card glass';
      card.innerHTML = `
        <div class="table-card-header">
          <h4 class="table-card-title"><i class="fa-solid fa-table text-teal mr-2"></i> ${s.name}</h4>
          <span class="badge badge-teal font-code">${rows.length} rows</span>
        </div>
        
        <div class="text-small text-muted mt-2">Columns:</div>
        <div class="font-code text-small mt-1" style="color: #2dd4bf; line-height: 1.5;">
          ${s.columns.map(c => `${c.name} (${c.type})`).join(', ')}
        </div>

        <div class="flex gap-2 mt-4 flex-wrap">
          <button class="btn btn-primary btn-sm flex-1" onclick="app.inspectTable('${s.name}')">
            <i class="fa-solid fa-eye"></i> Open Table
          </button>
          <button class="btn btn-secondary btn-sm" onclick="app.openRenameModal('${s.name}')" title="Rename Table">
            <i class="fa-solid fa-pen"></i>
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
    this.currentInspectTable = tableName;
    const schema = this.dbState.schemas[tableName];
    const rows = this.dbState.tables[tableName] || [];
    if (!schema) return;

    this.inspectTableTitle.innerHTML = `<i class="fa-solid fa-table text-teal mr-2"></i> Inspecting Table: ${tableName}`;
    this.inspectTableSubtitle.textContent = `${rows.length} total rows • Double-click any cell to edit directly.`;
    
    const headers = schema.columns.map(c => c.name);
    let html = `<table class="data-table"><thead><tr>`;
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += `<th style="text-align:right;">Actions</th></tr></thead><tbody>`;

    rows.forEach((r, rowIdx) => {
      html += `<tr>`;
      headers.forEach(h => {
        const val = r[h] !== null && r[h] !== undefined ? r[h] : '';
        html += `<td class="cell-editable" ondblclick="app.makeCellEditable(this, '${tableName}', ${rowIdx}, '${h}')">${val !== '' ? val : '<span class="text-muted">NULL</span>'}</td>`;
      });
      html += `<td style="text-align:right;"><button class="btn btn-danger-outline btn-xs" onclick="app.deleteRow('${tableName}', ${rowIdx})"><i class="fa-solid fa-trash"></i></button></td>`;
      html += `</tr>`;
    });

    html += `</tbody></table>`;
    this.inspectTableGrid.innerHTML = html;

    // Attach inline "+ Add Row" listener
    this.btnInspectAddInlineRow.onclick = () => this.addInlineEmptyRow(tableName);
    this.modalInspectTable.classList.remove('hidden');
  }

  addInlineEmptyRow(tableName) {
    const schema = this.dbState.schemas[tableName];
    if (!schema) return;

    const newRow = {};
    schema.columns.forEach((c, idx) => {
      newRow[c.name] = c.primaryKey ? (this.dbState.tables[tableName].length + 1) : `new_${c.name}`;
    });

    this.dbState.tables[tableName].push(newRow);
    this.persistCurrentState(`Visual: Added new row to '${tableName}'`);
    this.updateDbState();
    this.inspectTable(tableName);
    this.showToast('Row Created', `Visual row added to ${tableName}`, 'success');
  }

  makeCellEditable(tdElement, tableName, rowIdx, colName) {
    const currentValue = this.dbState.tables[tableName][rowIdx][colName] ?? '';
    tdElement.innerHTML = `<input type="text" class="cell-input" value="${currentValue}" />`;
    const input = tdElement.querySelector('input');
    input.focus();

    const saveCell = () => {
      const newVal = input.value;
      if (this.dbState.tables[tableName][rowIdx][colName] !== newVal) {
        this.dbState.tables[tableName][rowIdx][colName] = newVal;
        this.persistCurrentState(`Visual: Updated cell '${colName}' in '${tableName}' to "${newVal}"`);
        this.updateDbState();
        tdElement.innerHTML = newVal !== '' ? newVal : '<span class="text-muted">NULL</span>';
        this.showToast('Updated', `Cell updated to "${newVal}"`, 'success');
      } else {
        tdElement.innerHTML = newVal !== '' ? newVal : '<span class="text-muted">NULL</span>';
      }
    };

    input.onblur = saveCell;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        saveCell();
      }
    };
  }

  openManageSchemaModal(tableName) {
    const schema = this.dbState.schemas[tableName];
    if (!schema) return;
    this.modalColumnsList.innerHTML = '';

    schema.columns.forEach((c, idx) => {
      this.appendColumnRow(c.name, c.type, c.primaryKey);
    });

    this.modalManageColumns.classList.add('z-top');
    this.modalManageColumns.classList.remove('hidden');
  }

  appendColumnRow(name = '', type = 'TEXT', isPk = false) {
    const row = document.createElement('div');
    row.className = 'flex gap-2 align-center column-manage-row mb-2';
    row.innerHTML = `
      <input type="text" class="input-text flex-1 col-name-input" value="${name}" placeholder="Column Name" />
      <select class="select-input col-type-select">
        <option value="TEXT" ${type === 'TEXT' ? 'selected' : ''}>TEXT</option>
        <option value="INTEGER" ${type === 'INTEGER' ? 'selected' : ''}>INTEGER</option>
        <option value="REAL" ${type === 'REAL' ? 'selected' : ''}>REAL</option>
        <option value="BOOLEAN" ${type === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
        <option value="JSON" ${type === 'JSON' ? 'selected' : ''}>JSON</option>
        <option value="DATETIME" ${type === 'DATETIME' ? 'selected' : ''}>DATETIME</option>
      </select>
      <button class="btn btn-danger-outline btn-xs" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
    `;
    this.modalColumnsList.appendChild(row);
  }

  saveSchemaChanges() {
    if (!this.currentInspectTable) return;
    const tableName = this.currentInspectTable;
    const columnRows = this.modalColumnsList.querySelectorAll('.column-manage-row');
    
    const newCols = [];
    columnRows.forEach((r, idx) => {
      const name = r.querySelector('.col-name-input').value.trim();
      const type = r.querySelector('.col-type-select').value;
      if (name) {
        newCols.push({ name, type, primaryKey: idx === 0 });
      }
    });

    if (newCols.length === 0) {
      this.showToast('Error', 'Table must have at least 1 column.', 'error');
      return;
    }

    this.dbState.schemas[tableName].columns = newCols;
    this.persistCurrentState(`Visual: Updated schema & columns for '${tableName}'`);
    this.modalManageColumns.classList.add('hidden');
    this.modalManageColumns.classList.remove('z-top');
    this.updateDbState();
    this.inspectTable(tableName);
    this.showToast('Schema Updated', `Updated schema for '${tableName}' visually!`, 'success');
  }

  deleteRow(tableName, rowIndex) {
    if (this.dbState.tables[tableName]) {
      this.dbState.tables[tableName].splice(rowIndex, 1);
      this.persistCurrentState(`Visual: Deleted row at index ${rowIndex} from '${tableName}'`);
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

  importExternalProviderData() {
    const rawData = this.importProviderTextarea.value.trim();
    if (!rawData) {
      this.showToast('Error', 'Please paste PostgreSQL DDL or DynamoDB JSON payload.', 'error');
      return;
    }

    try {
      if (rawData.startsWith('{') || rawData.startsWith('[')) {
        // DynamoDB JSON
        const parsed = JSON.parse(rawData);
        Object.entries(parsed).forEach(([tbl, items]) => {
          this.dbState.schemas[tbl] = {
            name: tbl,
            columns: [{ name: 'id', type: 'TEXT', primaryKey: true }, { name: 'payload', type: 'JSON' }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          this.dbState.tables[tbl] = items.map((it, idx) => ({ id: idx + 1, payload: JSON.stringify(it) }));
        });

      } else {
        // SQL DDL / Insert
        this.sqlEditor.value = rawData;
        const statements = rawData.split(';').map(s => s.trim()).filter(Boolean);
        statements.forEach(st => {
          this.sqlEditor.value = st;
          this.executeSql();
        });
      }

      this.importProviderTextarea.value = '';
      this.persistCurrentState('Imported data from external provider');
      this.updateDbState();
      this.showToast('Import Complete', 'External provider data imported into COMBASE!', 'success');

    } catch (err) {
      this.showToast('Import Error', err.message, 'error');
    }
  }

  renderTimeTravel() {
    if (!this.timetravelContainer) return;
    this.timetravelContainer.innerHTML = '';

    if (this.commitHistory.length === 0) {
      this.timetravelContainer.innerHTML = `<div class="p-4 text-center text-muted">No state checkpoints recorded yet.</div>`;
      return;
    }

    this.commitHistory.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = 'glass p-4 flex align-center justify-between';
      card.innerHTML = `
        <div>
          <span class="badge badge-teal font-code mr-2">${c.sha}</span>
          <span class="font-bold">${c.message}</span>
          <span class="text-muted text-small ml-2">• ${new Date(c.timestamp).toLocaleTimeString()}</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.restoreCheckpoint('${c.sha}')">
          <i class="fa-solid fa-rotate-left"></i> Restore State
        </button>
      `;
      this.timetravelContainer.appendChild(card);
    });
  }

  restoreCheckpoint(sha) {
    const commit = this.commitHistory.find(c => c.sha === sha);
    if (!commit || !commit.snapshot) return;

    this.databases = JSON.parse(JSON.stringify(commit.snapshot));
    this.persistCurrentState(`Restored state to checkpoint ${sha}`);
    this.updateDbState();
    this.showToast('State Restored', `Restored database to checkpoint ${sha}`, 'success');
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
