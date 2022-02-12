

// indexedDB
class DB {
	// Открыть БД
	static open(dbName = 'DB', tableVersion=1) {
		return new Promise((resolve, reject) => {
			console.log("DB > open "+dbName);
			let request = indexedDB.open(dbName, tableVersion);
			request.onsuccess = e => {
				console.log("   > open "+dbName+" > success!");
				resolve(request.result);
			};
			request.onerror = e => {
				console.log("   > error "+dbName);
				reject(transaction.error);
			};
			request.onupgradeneeded = e => {
				console.log("   > open "+dbName+" > onupgradeneeded!");
				let thisDB = e.target.result;
				if (!thisDB.objectStoreNames.contains('abc')) {
					let objectStore = thisDB.createObjectStore('abc', { autoIncrement: true });
					objectStore.createIndex('words', 'words', { unique: false, multiEntry: true });
				}
			};
		});
	}
	// Удалить БД
	static delDB(dbName) {
		return new Promise((resolve, reject) => {
			console.log("DB > delDB");
			let request = indexedDB.deleteDatabase(dbName);
			request.onsuccess = e => {
				console.log("   > delDB > success!");
				resolve(request.result);
			}; // should be undefined
			request.onerror = e => {
				console.log("   > delDB > error!");
				reject(request.error);
			};
		});
	}
};

class DBTable {
	constructor(iDBDatabase, tableName) {
		this.db = iDBDatabase
		this.tableName = tableName;
	}

	// Добавить (передавать массив)
	add(array) {
		return new Promise((resolve, reject) => {
			console.log("DB > add");
			let transaction = this.db.transaction([this.tableName], "readwrite");
			let store = transaction.objectStore(this.tableName);
			for (let item of array) { store.put(item); }
			transaction.oncomplete = e => {
				console.log("   > add > success!");
				resolve();
			};
			transaction.onerror = e => {
				console.log("   > add > error!");
				reject(transaction.error);
			};
		});
	}

	// Получить одну запись
	getOne(key) {
		return new Promise((resolve, reject) => {
			console.log("DB > getOne");
			let transaction = this.db.transaction([this.tableName], "readonly");
			let request = transaction.objectStore(this.tableName).get(key);
			transaction.oncomplete = e => {
				console.log("   > getOne > success!");
				resolve(request.result);
			};
			transaction.onerror = e => {
				console.log("   > getOne > error!");
				reject(transaction.error);
			};
		});
	}

	getRange(filter_start, filter_end=false) {
		filter_end = (filter_end === false) ? filter_start : filter_end;
		return new Promise((resolve, reject) => {
			console.log("DB > getRange");
			let x = [];
			let transaction = this.db.transaction([this.tableName], "readonly");
			let request = transaction.objectStore(this.tableName);
			// let range = IDBKeyRange.bound(filter_start, filter_end + "\uffff");
			let range = IDBKeyRange.bound(filter_start, filter_end);
			request = request.index("words").openCursor(range);
			request.onsuccess = function(e) {
				let cursor = e.target.result;
				if (cursor) {
					x.push(cursor.value['words']);
					cursor.continue();
				}
				resolve(x);
			};
		});
	}

	// Получить все записи страницы/категории из одной таблицы
	get getAll() {
		return new Promise((resolve, reject) => {
			console.log("DB > getAll");
			let transaction = this.db.transaction([this.tableName], "readonly");
			let request = transaction.objectStore(this.tableName).getAll();
			transaction.oncomplete = e => {
				console.log("   > getAll > success!");
				resolve(request.result);
			};
			transaction.onerror = e => {
				console.log("   > getAll > error!");
				reject(transaction.error);
			};
		});
	}

	// Удалить одну запись
	delOne(key, idx=false) {
		return new Promise((resolve, reject) => {
			console.log("DB > delOne");
			let transaction = this.db.transaction([this.tableName], "readwrite");
			let store = transaction.objectStore(this.tableName);
			if (idx) { store.index(idx); }
			store.delete(key);
			transaction.oncomplete = e => {
				console.log("   > delOne > success!");
				resolve();
			};
			transaction.onerror = e => {
				console.log("   > delOne > error!");
				reject(transaction.error);
			};
		});
	}

	// Удалить все таблицы, но оставить БД
	delAll() {
		return new Promise((resolve, reject) => {
			console.log("DB > delAll");
			let transaction = this.db.transaction(['abc'], "readwrite");
			transaction.objectStore('abc').clear();
			transaction.oncomplete = e => {
				console.log("   > delAll > success!");
				resolve();
			};
			transaction.onerror = e => {
				console.log("   > delAll > error!");
				reject(transaction.error);
			};
		});
	}
};

