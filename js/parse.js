

var time; // Время выполнения загрузки и установки всей библиотеки
var time_part = null; // Время загрузки и установки каждой из частей

var indexedDB = ('indexedDB' in window) ? (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) : null;

var predlogy = ['как', 'с', 'итак', 'да', 'для', 'вроде', 'вне', 'обо', 'в', 'же', 'поскольку', 'чрез', 'пускай', 'ради', 'либо', 'под', 'над', 'раз', 'во', 'кабы', 'и', 'передо', 'едва', 'только', 'зато', 'вместо', 'за', 'пока', 'тоже', 'покуда', 'нежели', 'к', 'дабы', 'об', 'ровно', 'про', 'чтоб', 'на', 'коль', 'меж', 'чтобы', 'аж', 'у', 'ко', 'ежели', 'подо', 'из', 'словно', 'затем', 'между', 'ибо', 'будто', 'благо', 'также', 'или', 'до', 'а', 'лишь', 'чуть', 'если', 'но', 'коли', 'покамест', 'пред', 'так', 'перед', 'при', 'со', 'среди', 'безо', 'о', 'чем', 'от', 'ли', 'через', 'абы', 'причем', 'близ', 'разве', 'хотя', 'кроме', 'сквозь', 'пусть', 'изо', 'якобы', 'без', 'когда', 'хоть', 'что', 'притом', 'даже', 'ото', 'пo', 'ан'];

var memory = {
	'ws': [], // массив с данными xslx
	'sheets': [], // тут будет соответствие имени листа и номер массива
	'group': [], // имя группы
	'frazy': [], // массивы фрах по группам
};


function excelToJSON() {
	this.parseExcel = function(file) {
		let reader = new FileReader();
		reader.onload = function(e) {
			(async() => {
				let data = e.target.result;
				let workbook = XLSX.read(data, { type: 'binary' });
				for (let i=0; i<workbook.SheetNames.length; i++) {
					memory['sheets'].push(workbook.SheetNames[i]);
					memory['ws'].push(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]], {header: 1}));
				}
				createArray();
				await createFirstFormWords();
				console.log(memory['frazy']);
				createArrayMinus();
			})();
		};
		reader.onerror = function(ex) {
			console.log(ex);
		};
		reader.readAsBinaryString(file);
	};
}


function createArrayMinus() {
	// перебираем листы
	for (let j=0; j<memory['frazy'].length; j++) {
		let sheet = memory['frazy'][j];
		// перебираем группы
		for (let i=0; i<sheet.length; i++) {
			let group = sheet[i];
			// перебираем фразы
			for (let k=0; k<group.length; k++) {
				let words = group[k];
			}
		}
	}
}


async function createFirstFormWords() {
	let table = new DBTable(await DB.open(), 'abc');
	for (let j=0; j<memory['frazy'].length; j++) {
		for (let i=0; i<memory['frazy'][j].length; i++) {
			let words = memory['frazy'][j][i];
			if (typeof words == 'undefined') { continue; }
			for (let k=0; k<words.length; k++) {
				let x = await table.getRange(words[k]);
				x = (x.length == 0) ? words[k] : x[0][0];
				memory['frazy'][j][i][k] = x;
			}
		}
	}
}


function createArray() {
	console.log(memory['sheets']);
	for (let i=0; i<memory['ws'].length; i++) {
		let arrTmp_small = [];
		let arrTmp_group = [];
		for (let j=0; j<memory['ws'][i].length; j++) {
			let line = memory['ws'][i][j];
			let arrTmp_words = undefined;
			if (typeof line[1] != 'undefined') {
				arrTmp_words = line[1].split(' ');
				// Удаляем слово, если предлог или число
				arrTmp_words = arrTmp_words.filter(function(f) {
					if (predlogy.indexOf(f) == -1) {
						for (let q=0; q<f.length; q++) { if (!isNaN(f[q]-0)) { return false; } }
						return true;
					}
				});
			}
			if (line.length == 0) { arrTmp_small.push(arrTmp_words); }
			if (line[0] != null) {
				arrTmp_group.push(line[0]);
				if (arrTmp_small.length != 0) {
					memory['frazy'].push(arrTmp_small);
					arrTmp_small = [];
				}
			}
			arrTmp_small.push(arrTmp_words);
			if (j == memory['ws'][i].length-1) {
				memory['frazy'].push(arrTmp_small);
				memory['group'].push(arrTmp_group);
			}
		}
	}
	console.log(memory['group']);
	console.log(memory['frazy']);
}


async function loadFileLoop(table, num) {
	document.getElementById('progress').value = num;
	if (num > 15) {
		document.getElementById('progress').value = num;
		return false;
	}
	if (time_part != null) {
		time_part = (performance.now() - time_part) / 1000;
		console.log('Время выполнения '+num+' = ', time_part);
	}
	time_part = performance.now();
	await fetch('https://cross-minus.localhost/files_test/'+num+'.txt', { headers: { 'Content-Type':'text/plain; charset=utf-8' } })
		.then( response => response.text() )
		.then( text => {
			(async () => {
				console.log('Получил file');
				text = text.split('\r\n');
				let arr = [];
				let arr_small = [];
				for (let i=0; i<text.length; i++) {
					if (text[i][0] != ' ') {
						if (arr_small.length != 0) {
							arr.push({'words':arr_small});
							arr_small = [];
						}
						arr_small.push(text[i]);
					} else { arr_small.push(text[i].trim()); }
					if (i == text.length-1) {arr.push({'words':arr_small}); }
				}
				console.log('Создал массив');
				if (await table.add(arr, num+' ') === true) {
					console.log('Записал в БД');
					if (await loadFileLoop(table, num+1) == false) {
						console.log('Словарь скачался полностью');
						document.getElementById('upload').disabled = false;
						time = performance.now() - time;
						console.log('Время выполнения = ', time);
					}
				}
			})();
		});
}


function handleFileSelect(e) {
	let files = e.target.files; // FileList object
	let xl2json = new excelToJSON();
	xl2json.parseExcel(files[0]);
}


async function handleDownloadDictionary() {
	// let x = await table.getRange('слив');
	// console.log(x);
	time = performance.now();
	await loadFileLoop(table, 1);
}



document.getElementById('upload').onchange = handleFileSelect;
document.getElementById('dictionary').onclick = handleDownloadDictionary;



(async () => {
	document.getElementById('dictionary').disabled = true;

	let table = new DBTable(await DB.open(), 'abc');

	if (typeof await table.getOne(10) != 'undefined') {
		console.log('Есть таблица. Можно продолжить работу');
		document.getElementById('upload').disabled = false;
	} else {
		console.log('Нет таблицы. \nНажмите "Скачать словарь", чтобы продолжить работу');
		document.getElementById('dictionary').disabled = false;
	}
	document.getElementById('progress').value = 0;
})();


/*

(async () => {
	// let x = await table.getRange('слив');
	// console.log(x);
	var time = performance.now();

	let table = new DBTable(await DB.open(), 'abc');

	if (typeof await table.getOne(10) == 'undefined') {
		console.log('Нет таблицы. \nНажмите "Скачать словарь", чтобы продолжить работу');
		// await loadFileLoop(1);
	} else {
		console.log('Есть таблица. Можно продолжить работу');
		document.getElementById('upload').disabled = false;
		document.getElementById('dictionary').disabled = true;
	}

	time = performance.now() - time;
	console.log('Время выполнения = ', time);

})();

*/