
var indexedDB = ('indexedDB' in window) ? (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB) : null;

let predlogy = ['а','или','ведь','вот','и','если','чтобы','б','бы','то','ещё','как','ж','же','не','что','только','ну','ну-ка','также','уж','с','к','на','по','у','о','из','под','без','для','до','в','около','об','за','перед','через','вдоль','после','кроме','сквозь','вроде'];

let excelToJSON = function() {
	this.parseExcel = function(file) {
		let reader = new FileReader();
		reader.onload = function(e) {
			let data = e.target.result;
			let workbook = XLSX.read(data, { type: 'binary' });
			let ws = [];
			for (let i=0; i<workbook.SheetNames.length; i++) {
				ws.push(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[i]], {header: 1}));
			}
			console.log(ws);
		};
		reader.onerror = function(ex) {
			console.log(ex);
		};
		reader.readAsBinaryString(file);
	};
};



function handleFileSelect(e) {
	let files = e.target.files; // FileList object
	let xl2json = new excelToJSON();
	xl2json.parseExcel(files[0]);
};









document.getElementById('upload').onchange = handleFileSelect;

(async () => {

	// let table = new DBTable(await DB.open(), 'abc');
	// await table.add([
	// 	{'words':['слив','слива','сливу','слив','сливом','сливе']},
	// 	{'words':['сливы','сливов','сливам','сливы','сливами','сливах']},
	// 	{'words':['слива','сливы','сливе','сливу','сливой','сливе']},
	// 	{'words':['сливы','слив','сливам','сливы','сливами','сливах']}
	// ]);
	// let x = await table.getRange('слив');
	// console.log(x);


	let table = new DBTable(await DB.open(), 'abc');



	вместо цикла нужно сделать рекурсивную функцию


	// let f = 1;
	// while (f <= 15) {
		await fetch('https://cross-minus.localhost/files/1.txt', { headers: { 'Content-Type':'text/plain; charset=utf-8' } })
		// await fetch('https://cross-minus.localhost/files/test.txt', { headers: { 'Content-Type':'text/plain; charset=utf-8' } })
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
						} else {
							arr_small.push(text[i].trim());
						}
						if (i == text.length-1) {
							arr.push({'words':arr_small});
						}
					}
					// console.log(arr);
					console.log('Создал массив');
					await table.add(arr);
					console.log('Записал в БД');
				})();
			});
		// f++;
	// }


})();

