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

    constructor(audio) {

        this.audio = audio;
        this.is_over = false;

		setInterval(function(audio) {
    		audio.volume += (audio.target_volume - audio.volume) / 8;
    		if(audio.volume < 0.01)
    			audio.pause();
    		else
    			audio.play();
    	}, 30, this.audio);

        this.audio.onended = (event) => {
            this.is_over = true;
        };

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
        this._low_filter.frequency.value = 60;

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

        this._low_data      = new Uint8Array(this._buffer);
        this._low_sum       = new Array(this._buffer).fill(0);
        this._low_frames    = new Array(this._buffer).fill(1e-9);
        this._low_enveloped = new Array(this._buffer).fill(0);

        this._mid_data      = new Uint8Array(this._buffer);
        this._mid_sum       = new Array(this._buffer).fill(0);
        this._mid_frames    = new Array(this._buffer).fill(1e-9);
        this._mid_enveloped = new Array(this._buffer).fill(0);

        this._high_data      = new Uint8Array(this._buffer);
        this._high_sum       = new Array(this._buffer).fill(0);
        this._high_frames    = new Array(this._buffer).fill(1e-9);
        this._high_enveloped = new Array(this._buffer).fill(0);



    }

    update(){
    	
        this._low_analyzer.getByteFrequencyData(this._low_data);
        this._mid_analyzer.getByteFrequencyData(this._mid_data);
        this._high_analyzer.getByteFrequencyData(this._high_data);

        for(let position = 0; position < this._buffer; ++position){

        	let data, sums, frames, enveloped;

	    	if(position < 3){

	    		data      = this._low_data;
	    		sums      = this._low_sum;
                enveloped = this._low_enveloped;
	    		frames    = this._low_frames;

	    	} else if(position < 7) {

	    		data      = this._mid_data;
	    		sums      = this._mid_sum;
	    		enveloped = this._mid_enveloped;
                frames    = this._mid_frames;


	    	} else {

	    		data      = this._high_data;
	    		sums      = this._high_sum;
                enveloped = this._high_enveloped;
	    		frames    = this._high_frames;

	    	}

            if(data[position] > enveloped[position])
                enveloped[position] = data[position];
            else
                enveloped[position] *= 0.9;

            sums[position] += enveloped[position];
            frames[position]++;

        }

    }

    play(){

        this.audio.play();
		this.audio.target_volume = 0.5;

    }

    pause(){

    	this.audio.target_volume = 0;

    }

    is_on_beat(position, THRESHHOLD = 3, overwrite = true){

    	position = Math.min(position, this._buffer);

    	let data, sums, frames, DECAY;

    	if(position < 3){

    		data = this._low_enveloped;
    		sums = this._low_sum;
    		frames = this._low_frames;
    		DECAY = 0.3;

    	} else if(position < 9) {

    		data = this._mid_enveloped;
    		sums = this._mid_sum;
    		frames = this._mid_frames;
    		DECAY = 0.6;

    	} else {

    		data = this._high_enveloped;
    		sums = this._high_sum;
    		frames = this._high_frames;
    		DECAY = 0.9;

    	}

    	let avg = sums[position] / frames[position] - DECAY * frames[position];

    	if(frames[position] > 5 && data[position] - avg > THRESHHOLD) {

            sums[position] /= frames[position];
        	frames[position] = 1;

      		return true;

      	}

    	return false;
    
    }

}

class SFXManager {

    constructor(link, volume){
        this.audio = new Audio();
        this.audio.src = link;
        this.audio.autoplay = true;
        this.audio.controls = true;
        this.audio.crossOrigin = "anonymous";
		this.audio.volume = volume;

        this._context = new AudioContext();
        this._source = this._context.createMediaElementSource(this.audio);

        this._source.connect(this._context.destination);
        this.audio.pause();

        // Clone audio for multiple playings at once

        this.cloned_audio = this.audio.cloneNode();
        this.cloned_audio.volume = volume;
        this.cloned_audio.pause();

    }

    play() {
    	if(this.audio.paused == true)
    		this.audio.play();
    	else
    		this.cloned_audio.play();
    }

}

const playlist = [
    "https://cycnus-studio.github.io/Project/audio/QuestionMark.mp3",
    "https://cycnus-studio.github.io/Project/audio/HideAndSeek.mp3",
    "https://cycnus-studio.github.io/Project/audio/InTheTigersDen.mp3"];

class PlaylistManager {

    constructor(){

        this._current;
        this._music = [];

        for(let link of playlist){

            let audio = new Audio();
            audio.src = link;
            audio.controls = true;
            audio.autoplay = true;
            audio.loop = false;
            audio.crossOrigin = "anonymous";
            audio.volume = 1e-5;
            audio.target_volume = 1e-5;

            this._music.push(new AudioProcessor(audio));
            this._music[this._music.length - 1].pause();

        }

        this._current = this._music[rand_range(0, this._music.length - 1)];

        setInterval(function check_music_finished(playlist){
            if(playlist._current.is_over == true){
                playlist._current.pause();
                playlist.set_music(rand_range(0, playlist._music.length - 1));
            }
        }, 500, this);


    }

    set_music(position) {

        this._current = this._music[position];
        this._current.is_over = false;
        this._current.play();

    }

    update() {

        this._current.update();

    }

    play() {

        this._current.play();

    }

    pause() {

        this._current.pause();

    }

    is_on_beat(position, THRESHHOLD = 3, overwrite = true) {

        return this._current.is_on_beat(position, THRESHHOLD, overwrite);

    }

}
