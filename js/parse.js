

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
				let nameFile = getNameFile(file.name);
				console.log(nameFile);
				for (let i=0; i<workbook.SheetNames.length; i++) {
					memory['sheets'].push(workbook.SheetNames[i]);
					memory['ws'].push(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]], {header: 1}));
				}
				console.log('log - ws');
				console.log(memory['ws']);
				console.log('log - ws');
				createArray();
				await createFirstFormWords();
				console.log('-------------------------------');
				createArrayMinus();
				minusToGroup();
				addNewDataToWS();
				deleteUndefined();
				// convertArrayToObject();
				saveXlsxFile(nameFile);

			})();
		};
		reader.onerror = function(ex) {
			console.log(ex);
		};
		reader.readAsBinaryString(file);
	};
}

function getNameFile(arg) {
	let n = arg.split('.');
	n.splice(n.length-1, 1);
	return n.join('.');
}

function createArray() {
	console.log('log - sheets');
	console.log(memory['sheets']);
	console.log('log - sheets');
	// Перебираем листы
	for (let i=0; i<memory['ws'].length; i++) {
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
				// Удаляем слово, если предлог или число или одна буква
				arrTmp_words = arrTmp_words.filter(function(f) {
					if (predlogy.indexOf(f) == -1 && f.length > 1) {
						// for (let q=0; q<f.length; q++) { if (!isNaN(f[q]-0)) { return false; } }
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
	console.log('log - group');
	console.log(memory['group']);
	console.log('log - group');
	console.log('log - frazy');
	console.log(memory['frazy']);
	console.log('log - frazy');
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
				// Удалить дубликаты слов из фразы
				memory['frazy'][s][g][w] = memory['frazy'][s][g][w].filter((item, index) => { return memory['frazy'][s][g][w].indexOf(item) === index; });
			}
		}
	}
}


function createArrayMinus() {
	// перебираем листы
	for (let s=0; s<memory['frazy'].length; s++) {
		let sheet = memory['frazy'][s];
		memory['minus'][s] = [];
		// перебираем группы
		for (let g=0; g<sheet.length; g++) {
			let group = sheet[g];
			memory['minus'][s][g] = [];
			// перебираем фразы
			for (let w=0; w<group.length; w++) {
				let words = group[w];
				memory['minus'][s][g][w] = [];


				// перебираем листы
				for (let ss=0; ss<memory['frazy'].length; ss++) {
					let sheet2 = memory['frazy'][ss];
					// перебираем группы
					for (let gg=0; gg<sheet2.length; gg++) {

						// Если группы совпадают, значит пропускаем
						if (ss == s && gg == g) { break; }

						let group2 = sheet2[gg];
						// перебираем фразы
						for (let ww=0; ww<group2.length; ww++) {
							let words2 = group2[ww];

							// Сравниваем количество элементов в массиве. Должно быть +1
							if (typeof words == 'undefined' || typeof words2 == 'undefined') { continue; }
							if (words.length != words2.length-1) { continue; }
							let newElem = getNewElementBetween(words, words2);
							if (newElem !== false) {
								// console.log(s, g, w, newElem);
								memory['minus'][s][g][w].push(newElem);
							}
						}
					}
				}

				// Удалить дубликаты слов из фразы
				memory['minus'][s][g][w] = memory['minus'][s][g][w].filter((item, index) => { return memory['minus'][s][g][w].indexOf(item) === index; });

			}
		}
	}
	console.log('log - minus');
	console.log(memory['minus']);
	console.log('log - minus');
}


function minusToGroup() {
	// return;
	let minus = memory['minus'];
	let newMinus = [];
	for (let s=0; s<minus.length; s++) {
		let sheet = minus[s];
		newMinus[s] = [];

		for (let g=0; g<sheet.length; g++) {
			let group = sheet[g];
			let newGroup = [];
			newMinus[s][g] = [];

			for (let w=0; w<group.length; w++) {
				let words = group[w];
				newMinus[s][g][w] = [];

				if (typeof memory['frazy'][s][g][w] != 'undefined') {
					for (let k=0; k<memory['frazy'][s][g][w].length; k++) {
						newGroup.push(memory['frazy'][s][g][w][k]);
					}
				}

				if (typeof words == 'undefined') { continue; }

				for (let k=0; k<words.length; k++) {
					if (typeof words[k] != 'undefined') {
						newMinus[s][g][0].push(words[k]);
					}
					// memory['minus'][s][g][w] = [];
				}
			}
			newGroup = newGroup.filter((item, index) => { return newGroup.indexOf(item) === index; });
			newMinus[s][g][0] = newMinus[s][g][0].filter((item, index) => { return newMinus[s][g][0].indexOf(item) === index; });
			newMinus[s][g][0] = newMinus[s][g][0].filter(e => !~newGroup.indexOf(e));
		}
	}
		memory['minus'] = newMinus;
		// console.log(newMinus);
		// console.log('log - minusToGroup');
		// console.log(memory['minus']);
		// console.log('log - minusToGroup');
}


function addNewDataToWS() {
	let minus = memory['minus'];
	for (let s=0; s<minus.length; s++) {
		let i = 0;
		let sheet = minus[s];

		for (let g=0; g<sheet.length; g++) {
			let group = sheet[g];

			for (let w=0; w<group.length; w++) {
				let words = group[w];
				if (typeof words == 'undefined' || words.length == 0) { i++; continue; }
				words = words.join(', ');
				memory['ws'][s][i].splice(2, 0, words);
				i++;
			}
		}

	}
	console.log('log - newDataWS');
	console.log(memory['ws']);
	console.log('log - newDataWS');
}


function deleteUndefined() {
	for (let i=0; i<memory['ws'].length; i++) {
		for (let j=0; j<memory['ws'][i].length; j++) {
			for (let k=0; k<memory['ws'][i][j].length; k++) {
				if (typeof memory['ws'][i][j][k] == 'undefined') {
					memory['ws'][i][j][k] = '';
				}
			}
		}
	}
}


function convertArrayToObject() {
	let ws = memory['ws'];
	let newWS = [];

	for (let s=0; s<ws.length; s++) {
		newWS[s] = [];
		for (let i=0; i<ws[s].length; i++) {
			newWS[s].push({
				'group': ws[s][i][0],
				'words': ws[s][i][1],
				'minus': ws[s][i][2]
			});
		}
	}
	memory['ws'] = newWS;
}


function saveXlsxFile(nameFile) {
	let newWorkbook = XLSX.utils.book_new();
	for (let i=0; i<memory['sheets'].length; i++) {
		let page = XLSX.utils.aoa_to_sheet(memory['ws'][i]);
		XLSX.utils.book_append_sheet(newWorkbook, page, memory['sheets'][i]);
	}
	XLSX.writeFile(newWorkbook, nameFile+' (minus).xlsx');
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
	await fetch('files/'+num+'.txt', { headers: { 'Content-Type':'text/plain; charset=utf-8' } })
		.then( response => response.text() )
		.then( textResult => {
			(async () => {
				console.log('Получил file');
				let text = textResult.split('\r\n');
				if (text.length < 100) { text = textResult.split('\n'); }
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
							document.getElementById('dictionary').disabled = true;
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


function getNewElementBetween(what, where) {
	let arrForReturn = [];
	for (let i=0; i<where.length; i++) {
		if (what.indexOf(where[i]) == -1) {
			arrForReturn.push(where[i]);
			if (arrForReturn.length > 1) { return false; }
		}
	}
	return arrForReturn[0];
}


function handleFileSelect(e) {
	memory = { 'ws': [], 'sheets': [], 'group': [], 'frazy': [], 'minus': [] };
	let el = e.target;
	let xl2json = new excelToJSON();
	xl2json.parseExcel(el.files[0]);
	el.value = '';
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