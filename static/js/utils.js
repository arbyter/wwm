/**
 * returns a random number.  
 * @param d maximum
 * @returns
 */
function random(d){
	return parseInt(10000000*Math.random())%d;
}

/**
 * generates a list of numbers
 */
function getnumlist(){
	var a=[];
	start = arguments[0];
	end = arguments[1];
	for(var i=start;i<=end;i++){
	  a.push(i);
	}
	
	return a;
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * remove a single element from the list
 */
function popn(){
  l = arguments[0];
  p = arguments[1];
  l.splice(p,1);
  return l;
}
