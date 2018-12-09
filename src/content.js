import onWatch from '@/content/dom';

function userPassFieldsFound(inputs) {
  console.log(inputs, inputs.length);
  for (var i = 0; i < inputs.length; i++) {
    console.log(inputs[i].id, inputs[i].type);
  }
}

function start() {
  var inputs = document.getElementsByTagName('input');
  if (!userPassFieldsFound(inputs)) {
    return;
  }
  console.log(event, inputs);
}

onWatch(start);
