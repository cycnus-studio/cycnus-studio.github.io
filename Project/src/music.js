/*
 *  A high-level audio API, to be used with syncing enemy actions with the music.
 *
 *  Cycnus Studio
 *
 *  June 2nd, 2019  
 *
 */


//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API


class AudioProcessor{

    constructor(link = 'https://cycnus-studio.github.io/QuestionMark.mp3') {
        this.audio = new Audio();
        this.audio.src = link;
        this.audio.controls = true;
        this.audio.loop = true;
        this.audio.autoplay = true;
        this.audio.crossOrigin = "anonymous";
		this.audio.playbackRate = 1;

        this._context = new AudioContext();
        this._source = this._context.createMediaElementSource(this.audio);
        
        this._low_analyzer = this._context.createAnalyser();
        this._mid_analyzer = this._context.createAnalyser();
        this._high_analyzer = this._context.createAnalyser();

        // Low Filter

        this._low_filter = this._context.createBiquadFilter();
        this._source.connect(this._low_filter);
        this._low_filter.connect(this._low_analyzer);

        this._low_filter.type = 'lowpass';
        this._low_filter.frequency.value = 50;

        // Mid Filter

        this._mid_filter = this._context.createBiquadFilter();
        this._source.connect(this._mid_filter);
        this._mid_filter.connect(this._mid_analyzer);

        this._mid_filter.type = 'bandpass';
        this._mid_filter.frequency.value = 500;

        // Mid boost

        this._mid_boost = this._context.createBiquadFilter();
        this._mid_filter.connect(this._mid_boost);
        this._mid_boost.connect(this._mid_analyzer);

        this._mid_boost.type = 'peaking';
        this._mid_boost.frequency.value = 500;
        this._mid_boost.gain.value = 20;

        // High Filter

        this._high_filter = this._context.createBiquadFilter();
        this._source.connect(this._high_filter);
        this._high_filter.connect(this._high_analyzer);

        this._high_filter.type = 'highpass';
        this._high_filter.frequency.value = 2000;

        // High boost

        this._high_boost = this._context.createBiquadFilter();
        this._high_filter.connect(this._high_boost);
        this._high_boost.connect(this._high_analyzer);

        this._high_boost.type = 'peaking';
        this._high_boost.frequency.value = 2000;
        this._high_boost.gain.value = 20;

        this._source.connect(this._context.destination);

        this._low_analyzer.fftSize = 32;
        this._mid_analyzer.fftSize = 32;
        this._high_analyzer.fftSize = 32;

        this._buffer = this._low_analyzer.frequencyBinCount;

        this._low_data   = new Uint8Array(this._buffer);
        this._low_sum    = new Array(this._buffer).fill(0);
        this._low_frames = new Array(this._buffer).fill(1e-9);

        this._mid_data   = new Uint8Array(this._buffer);
        this._mid_sum    = new Array(this._buffer).fill(0);
        this._mid_frames = new Array(this._buffer).fill(1e-9);

        this._high_data   = new Uint8Array(this._buffer);
        this._high_sum    = new Array(this._buffer).fill(0);
        this._high_frames = new Array(this._buffer).fill(1e-9);

    }

    update(){
    	
        this._low_analyzer.getByteFrequencyData(this._low_data);
        this._mid_analyzer.getByteFrequencyData(this._mid_data);
        this._high_analyzer.getByteFrequencyData(this._high_data);

        for(let position = 0; position < this._buffer; ++position){

        	let data, sums, frames;

	    	if(position < 3){

	    		data = this._low_data;
	    		sums = this._low_sum;
	    		frames = this._low_frames;

	    	} else if(position < 7) {

	    		data = this._mid_data;
	    		sums = this._mid_sum;
	    		frames = this._mid_frames;

	    	} else {

	    		data = this._high_data;
	    		sums = this._high_sum;
	    		frames = this._high_frames;

	    	}

	    	sums[position] += data[position];
	    	frames[position]++;

        }

    }

    play(){
        this.audio.play();
    }

    pause(){
        this.audio.pause();
    }

    is_on_beat(position){

    	position = Math.min(position, this._buffer);
      
    	const THRESHHOLD = 3;

    	let data, sums, frames, DECAY;

    	if(position < 3){

    		data = this._low_data;
    		sums = this._low_sum;
    		frames = this._low_frames;
    		DECAY = 0.3;

    	} else if(position < 9) {

    		data = this._mid_data;
    		sums = this._mid_sum;
    		frames = this._mid_frames;
    		DECAY = 0.6;

    	} else {

    		data = this._high_data;
    		sums = this._high_sum;
    		frames = this._high_frames;
    		DECAY = 0.9;

    	}

    	let avg = sums[position] / frames[position] - DECAY * frames[position];

    	if(avg != 0 && data[position] - avg > THRESHHOLD) {

    		frames[position] = 1e-9;
    		sums[position] = 0;

      		return true;

      	}

    	return false;
    
    }

}


class SFXManager {

    constructor(){
        // do something........................................................ .-.
    }

}
