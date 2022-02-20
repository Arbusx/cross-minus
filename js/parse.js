

var time; // Время выполнения загрузки и установки всей библиотеки
var time_part = null; // Время загрузки и установки каждой из частей
var count_files = 10;
var progress = document.getElementById('progress').max;

var indexedDB = ('indexedDB' in window) ? (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) : null;

var predlogy = ['как', 'с', 'итак', 'да', 'для', 'вроде', 'вне', 'обо', 'в', 'же', 'поскольку', 'чрез', 'пускай', 'ради', 'либо', 'под', 'над', 'раз', 'во', 'кабы', 'и', 'передо', 'едва', 'только', 'зато', 'вместо', 'за', 'пока', 'тоже', 'покуда', 'нежели', 'к', 'дабы', 'об', 'ровно', 'про', 'чтоб', 'на', 'коль', 'меж', 'чтобы', 'аж', 'у', 'ко', 'ежели', 'подо', 'из', 'словно', 'затем', 'между', 'ибо', 'будто', 'благо', 'также', 'или', 'до', 'а', 'лишь', 'чуть', 'если', 'но', 'коли', 'покамест', 'пред', 'так', 'перед', 'при', 'со', 'среди', 'безо', 'о', 'чем', 'от', 'ли', 'через', 'абы', 'причем', 'близ', 'разве', 'хотя', 'кроме', 'сквозь', 'пусть', 'изо', 'якобы', 'без', 'когда', 'хоть', 'что', 'притом', 'даже', 'ото', 'пo', 'ан'];

var memory = {
	'ws': [], // массив с данными xslx
	'sheets': [], // тут будет соответствие имени листа и номер массива
	'group': [], // имя группы
	'frazy': [], // массивы фраз по группам
	'minus': [], // массивы минус-слов по группам
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
				console.log('-------------------------------');
				createArrayMinus();
			})();
		};
		reader.onerror = function(ex) {
			console.log(ex);
		};
		reader.readAsBinaryString(file);
	};
}


function createArray() {
	console.log(memory['sheets']);
	// Перебираем листы
	for (let i=0; i<memory['ws'].length; i++) {
		console.log('ЛИСТ', i);
		let sheet = memory['ws'][i];
		let arrTmp_group = []; // Массив имён группы
		let arrTmp_big = []; // Массив для группы фраз
		let arrTmp_small = []; // Промежуточный массив для фраз

		// Перебираем все строки в листе, делим на группы
		for (let j=0; j<sheet.length; j++) {
			let line = sheet[j]; // Первый и второй элемент строки
			let arrTmp_words = undefined; // Будущий массив слов в строке
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
			// Если есть название группы
			if (line[0] != null) {
				arrTmp_group.push(line[0]);
				if (arrTmp_small.length != 0) {
					arrTmp_big.push(arrTmp_small);
					arrTmp_small = [];
				}
			}
			arrTmp_small.push(arrTmp_words);
			// Если конец листа
			if (j == sheet.length-1) {
				if (arrTmp_small.length != 0) {
					arrTmp_big.push(arrTmp_small);
				}
				memory['group'].push(arrTmp_group);
			}
		}
		memory['frazy'][i] = arrTmp_big;
	}
	console.log('перебор1');
	console.log(memory['group']);
	console.log(memory['frazy']);
	console.log('перебор2');
	for (let i=0; i<memory['frazy'].length; i++) {
		console.log(memory['frazy'][i]);
	}
}


async function createFirstFormWords() {
	let table = new DBTable(await DB.open(), 'abc');
	for (let s=0; s<memory['frazy'].length; s++) {
		let sheet = memory['frazy'][s];
		for (let g=0; g<sheet.length; g++) {
			let group = sheet[g];
			for (let w=0; w<group.length; w++) {
				let words = group[w];
				if (typeof words == 'undefined') { continue; }
				for (let k=0; k<words.length; k++) {
					if (typeof words[k] == 'undefined') { continue; }
					let x = await table.getRange(words[k].toLowerCase());
					x = (x.length == 0) ? words[k].toLowerCase() : x[0][0];
					memory['frazy'][s][g][w][k] = x;
				}

			}
		}
	}
}


function createArrayMinus() {
	// перебираем листы
	for (let s=0; s<memory['frazy'].length; s++) {
		let sheet = memory['frazy'][s];
		// перебираем группы
		for (let g=0; g<sheet.length; g++) {
			let group = sheet[g];
			// перебираем фразы
			for (let w=0; w<group.length; w++) {
				let words = group[w];


				// перебираем листы
				for (let ss=0; ss<memory['frazy'].length; ss++) {
					let sheet2 = memory['frazy'][ss];
					// перебираем группы
					for (let gg=0; gg<sheet2.length; gg++) {

						// Если группы совпадают, значит пропускаем
						if (gg == g) { continue; }

						let group2 = sheet2[gg];
						// перебираем фразы
						for (let ww=0; ww<group2.length; ww++) {
							let words2 = group2[ww];

							// Сравниваем количество элементов в массиве. Должно быть +1
							if (typeof words == 'undefined' || typeof words2 == 'undefined') { continue; }
							if (words.length != words2.length+1) { continue; }
							console.log('Смотрим дальше');

							let a = ['aa', 'bb'];
							let v = a.slice(0); // копируем значения переменной, а не ссылку на переменную

						}
					}
				}


			}
		}
	}
}


async function loadFileLoop(table, num) {
	let el_prog = progress/count_files*(num-1);
	let el_perc = 100/count_files*(num-1);
	document.getElementById('progress').value = el_prog;
	document.getElementById('progress_percent').innerText = el_perc.toFixed(2)+'%';
	if (num > count_files) {
		document.getElementById('progress').value = progress;
		document.getElementById('progress_percent').innerText = '100%';
		return false;
	}
	if (time_part != null) {
		time_part = (performance.now() - time_part) / 1000;
		console.log('Время выполнения '+num+' = ', time_part);
	}
	time_part = performance.now();
	await fetch('https://cross-minus.localhost/files/'+num+'.txt', { headers: { 'Content-Type':'text/plain; charset=utf-8' } })
		.then( response => response.text() )
		.then( text => {
			(async () => {
				console.log('Получил file');
				text = text.split('\r\n');
				let arr = [];
				let arr_small = [];
				for (let i=0; i<text.length; i++) {
					if (text[i].length == 0) {
						if (arr_small.length != 0) {
							arr.push({'words':arr_small});
							arr_small = [];
						}
						continue;
					}
					arr_small.push(text[i]);
					if (i == text.length-1) {arr.push({'words':arr_small}); }
				}
				console.log('Создал массив', arr.length);
				let prog = progress/count_files/arr.length;
				let percent = 100/count_files/arr.length;
				for (let k=0; k<arr.length; k++) {
					document.getElementById('progress').value = el_prog+prog*(k+1);
					document.getElementById('progress_percent').innerText = (el_perc+percent*(k+1)).toFixed(2)+'%';
					await table.add([arr[k]], num+' ');
					if (k == arr.length-1) {
						if (await loadFileLoop(table, num+1) == false) {
							console.log('Словарь скачался полностью');
							document.getElementById('upload').disabled = false;
							time = (performance.now() - time) / 1000;
							console.log('Время выполнения = ', time);
						}
					}
				}
			})();
		})
		.catch(e => {
			console.log('Обязательно перейдите на защищённую версию сайта. https://');
			location.href = location.href.replace("http://", "https://");
		});
}


function handleFileSelect(e) {
	let files = e.target.files; // FileList object
	let xl2json = new excelToJSON();
	xl2json.parseExcel(files[0]);
}


async function handleDownloadDictionary() {
	// let x = await table.getRange('слив');
	time = performance.now();
	// console.log(x);
	await loadFileLoop(new DBTable(await DB.open(), 'abc'), 1);
}


async function handleDeleteDictionary() {
	document.getElementById('upload').disabled = true;
	document.getElementById('dictionary').disabled = true;
	document.getElementById('delete_dictionary').disabled = true;
	if (new DBTable(await DB.delDB(), 'abc')) {
		window.location.reload();
	}
}


document.getElementById('upload').onchange = handleFileSelect;
document.getElementById('dictionary').onclick = handleDownloadDictionary;
document.getElementById('delete_dictionary').onclick = handleDeleteDictionary;



(async () => {
	document.getElementById('dictionary').disabled = true;

	let table = new DBTable(await DB.open(), 'abc');
	// await table.add(array_test);

	let x = await table.getRange('абаканской');
	console.log('test', x);


	if (typeof await table.getOne(175500) != 'undefined') {
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