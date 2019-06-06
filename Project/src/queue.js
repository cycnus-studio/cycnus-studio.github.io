/*
 *	A library of datastructures (Hopefully only an indexed queue and nothing else :s)
 *
 *  Author: cycnus studio
 *  Date: May 31, 2019
 */


 class Queue{

 	constructor(arr = []) {
		this.array = arr;
		this.start = 0;
	}

	get(pos){
		return this.array[pos];
	}

	push_back(item){
		this.array.push(item); 
	}

	pop(item){
		return this.array.shift(0);
	}

	get length(){
		return this.array.size();
	}

}