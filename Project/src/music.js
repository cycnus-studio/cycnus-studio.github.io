/*
 *  A high-level audio API, to be used with syncing enemy actions with the music.
 *
 *  Cycnus Studio
 *
 *  June 2nd, 2019  
 *
 */



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
        this.analyser = this._context.createAnalyser();
        this._source = this._context.createMediaElementSource(this.audio);
        
        this._source.connect(this.analyser);
        this.analyser.connect(this._context.destination);

        this.analyser.fftSize = 32;

        this._buffer = this.analyser.frequencyBinCount;

        this._data = new Uint8Array(this._buffer);
        this._peak = new Uint8Array(this._buffer);

    }
	
	speedUp(delta){
		this.audio.playbackRate += delta;
	}

    update(){
        this.analyser.getByteFrequencyData(this._data);
    }

    play(){
        this.audio.play();
    }

    pause(){
        this.audio.pause();
    }

    get _normalized(){

        let data = [];
        let highest = 1e-9; // Prevent division by 0
        
        for(let i = 0; i < this._buffer; ++i)
            highest = Math.max(highest, this._data[i]);
        
        for(let i = 0; i < this._buffer; ++i)
            data.push(this._data[i] / highest);
        
        return data;

    }

    is_on_beat(left, right){
      
      const THRESHHOLD = 0.95;
      const DECAY = 0.0001;

      let data = this._normalized;

      for(let i = left; i < Math.min(this._buffer, right); ++i){

          if(data[i] > THRESHHOLD * (i / 100) && data[i] > this._peak[i]){
              this._peak[i] = data[i];
              return true;
          }
          this._peak[i] -= DECAY;
      }

      return false;
    
    }

}


class SFXManager {

    constructor(){
        // do something........................................................ .-.
    }

}