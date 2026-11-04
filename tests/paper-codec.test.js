import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encoded, compileQuestion, symbolSvg } from '../js/paper-codec.js';
import { publicQuestionSet, validateQuestionSet } from '../shared/question-set.js';

test('cipher encoding uses project conventions and validates input',()=>{
 assert.equal(encoded('SOS','Morse').prompt,'... --- ...');
 assert.equal(encoded('ABC','Grid').prompt,'SS CS OS');
 assert.equal(encoded('ABC','Phone').prompt,'21 22 23');
 assert.equal(encoded('ABC','Caesar').prompt,'DEF');
 assert.equal(encoded('ABC','Atbash').prompt,'ZYX');
 assert.equal(encoded('ABC','Reverse').prompt,'CBA');
 assert.equal(encoded('AB','Braille').prompt,'⠁ ⠃');
 assert.equal(encoded('AJ','Semaphore').prompt,'4,5 2,0');
 assert.equal(encoded('AZ','Pigpen').prompt,'0 25');
 assert.throws(()=>encoded('J','Grid'));
 assert.throws(()=>encoded('1','Semaphore'));
 assert.ok(symbolSvg('semaphore','4,5').includes('<svg'));
 assert.equal(symbolSvg('pigpen','<img>'),'');
});
test('public papers omit answers and validate their symbolic data',()=>{
 const question=compileQuestion({id:'q1',type:'Semaphore',direction:'decode',text:'AB'});
 const set={id:'paper',title:'測試',revision:1,questions:[question]};
 assert.ok(validateQuestionSet(set,{privateAnswers:true}));
 const data=publicQuestionSet(set);
 assert.equal(JSON.stringify(data).includes('AB'),false);
 assert.ok(!('answer' in data.questions[0]));
 assert.equal(validateQuestionSet({...set,questions:[{...question,prompt:'<script>'}]}),null);
});
