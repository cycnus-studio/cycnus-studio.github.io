/*
 *  A high-level audio API, to be used with syncing enemy actions with the music.
 *
 *  Author: Cycnus Studio
 *
 *  Date: June 2nd, 2019  
 *
 */


// All features implemented using the incredibly useful API at https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API


class AudioProcessor{

    /*

        A class to manage audio processors and processes the current piece.

    */

    constructor(audio) {

        /*
        
            Initializes the audio processor.

            [Input]
                audio => An object representing the music track.

            [Output]
                None

        */

        // Load music

        this.audio = audio;
        this.is_over = false;

        // Periodically check whether volumr is lowered (Indicating game has paused)

        setInterval(function(audio) {
            
            audio.volume += (audio.target_volume - audio.volume) / 8; // Non-linearly increased/decreased

            if(audio.volume < 0.01) // Pause if quiet
                audio.pause();
            else                    // Play if loud enough
                audio.play();

        }, 30, this.audio);

        // .onended is a built-in event handler property in the API that allows to call a function if the audio has finished playing

        this.audio.onended = (event) => {

            // In this case we want to have the music playlist handler to realize that the song is over with a boolean

            this.is_over = true;
        
        };

        /*

            Alright, now for the fun things. How to analyze a piece of audio?

            Music is really a bunch of pitches playing at different volumes/levels.

            These pitches are a bunch of frequencies (measured in hertz). Higher frequencies mean a higher pitch, and thus a higher tone. Lower pitches have a lower frequency.

            Now let us define what a "beat" in a song really is:

                A beat is the moment where the volume/level of multiple frequencies increase significantly.

            A general idea/pseudocode surfaces:

                1 - Check for frequencies and previous levels of the frequencies.

                2 - Has it been increasing?

            Unfortunately this assumes that levels of a frequency are smooth numerical values.

            While they are numbers/integers, closer inspection suggests that they vary quite alot in between frames. We need to smooth these numbers out.

            A second inspection also suggests that different melodies/harmonies can alias themselves to the bass line (which holds the main tempo/beat), influencing and creating false positives.

        */

        /*

            How to solve these issues?
            
            For the first issue, we can smooth these out through tricks such as basic "envelopping" and keeping a running average for specific frequencies.

                https://www.teachmeaudio.com/recording/sound-reproduction/sound-envelopes/

                In this case, "attack" would be the section we are looking for, while "decay", "sustain", and "release" are all smoothed out with the envelope using this approach:

                if(current_level[frequency] > envelopped[frequency]){

                    envelopped[frequency] = current_level[frequency]; // Update peak

                } else {

                    envelopped[frequency] *= 0.95; // Decay the peak as the beat fades away
                }

                Meanwhile, a running average would get the average level of beat before the current frame and would thus smooth out past values as it converges to a specific amount.

            Luckily, the JS Web Audio API has some nifty (but complicated tricks) that allow you to filter specific frequencies and boost others:

                These are Biquad Filters: https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type

                In this case we want specific

        */

        /*

            "The AudioContext interface represents an audio-processing graph built from audio modules linked together."

            The audio processor is in realty a graph, this._context is the source of the audio.

            This audio processor connects 3 branches: low, medium, and high frequencies.

            Each of these branches have a filter to fade out the higher/lower pitches, while boosting the similar frequencies.

            These filtered/processed audio are then connected to an independent analyzer used to process the individual branch.


            The result is an evened out and a significant improvement of specific frequencies.

        */

        this._context = new AudioContext();
        this._source = this._context.createMediaElementSource(this.audio); // Connect to audio

        // Create the analyzers
        
        this._low_analyzer = this._context.createAnalyser();
        this._mid_analyzer = this._context.createAnalyser();
        this._high_analyzer = this._context.createAnalyser();

        // Low Filter

        this._low_filter = this._context.createBiquadFilter();

        // Connect to audio graph

        this._source.connect(this._low_filter);
        this._low_filter.connect(this._low_analyzer);

        this._low_filter.type = 'lowpass';     // Lowpass grabs the lower tones
        this._low_filter.frequency.value = 60; // Frequency we're looking for

        // Mid Filter

        this._mid_filter = this._context.createBiquadFilter();

        // Connect to audio graph

        this._source.connect(this._mid_filter);

        this._mid_filter.type = 'bandpass';     // Bandpass grabs the middle tones
        this._mid_filter.frequency.value = 500; // Frequency we're looking for

        // Mid boost

        this._mid_boost = this._context.createBiquadFilter();
        this._mid_filter.connect(this._mid_boost);
        this._mid_boost.connect(this._mid_analyzer);

        this._mid_boost.type = 'peaking';      // Peaking boosts a specific range of tones
        this._mid_boost.frequency.value = 500; // Frequency we're looking for
        this._mid_boost.gain.value = 10;       // Boost amount

        // High Filter

        this._high_filter = this._context.createBiquadFilter();
        this._source.connect(this._high_filter);

        this._high_filter.type = 'highpass';   // Highpass grabs the high tones
        this._high_filter.frequency.value = 2000;

        // High boost

        this._high_boost = this._context.createBiquadFilter();
        this._high_filter.connect(this._high_boost);
        this._high_boost.connect(this._high_analyzer);

        this._high_boost.type = 'peaking';       // Peaking boosts a specific range of tones
        this._high_boost.frequency.value = 2000; // Frequency we're looking for
        this._high_boost.gain.value = 10;        // Boost amount

        this._source.connect(this._context.destination); // Connect source to destination (Where the audio actually plays)

        this._low_analyzer.fftSize = 32; // Set size for Fast Fourier Transform (This is used to process signals, we can set a greater size if we want more specific tones)
        this._mid_analyzer.fftSize = 32;
        this._high_analyzer.fftSize = 32;

        this._buffer = this._low_analyzer.frequencyBinCount; // Number of tones we can check for

        // Keeping track of data (initializing all the arrays)

        this._low_data       = new Uint8Array(this._buffer);       // Initial data from the processor
        this._low_sum        = new Array(this._buffer).fill(0);    // Running sum for the average
        this._low_frames     = new Array(this._buffer).fill(1e-9); // Number of terms for average
        this._low_enveloped  = new Array(this._buffer).fill(0);    // Envelopped data

        this._mid_data       = new Uint8Array(this._buffer);
        this._mid_sum        = new Array(this._buffer).fill(0);
        this._mid_frames     = new Array(this._buffer).fill(1e-9);
        this._mid_enveloped  = new Array(this._buffer).fill(0);

        this._high_data      = new Uint8Array(this._buffer);
        this._high_sum       = new Array(this._buffer).fill(0);
        this._high_frames    = new Array(this._buffer).fill(1e-9);
        this._high_enveloped = new Array(this._buffer).fill(0);



    }

    update(){

        /*
        
            Updates the processor and receives new values for frequencies.

            [Input]
                None

            [Output]
                None

        */

        // Get data
        
        this._low_analyzer.getByteFrequencyData(this._low_data);
        this._mid_analyzer.getByteFrequencyData(this._mid_data);
        this._high_analyzer.getByteFrequencyData(this._high_data);

        // Envelop the data

        for(let position = 0; position < this._buffer; ++position){

            let data, sums, frames, enveloped;

            if(position < 3){

                // Low branch

                data      = this._low_data;
                sums      = this._low_sum;
                enveloped = this._low_enveloped;
                frames    = this._low_frames;

            } else if(position < 7) {

                // Mid range

                data      = this._mid_data;
                sums      = this._mid_sum;
                enveloped = this._mid_enveloped;
                frames    = this._mid_frames;


            } else {

                // High tones

                data      = this._high_data;
                sums      = this._high_sum;
                enveloped = this._high_enveloped;
                frames    = this._high_frames;

            }

            // Envelopping

            if(data[position] > enveloped[position])
                enveloped[position] = data[position];
            else
                enveloped[position] *= 0.9;

            // Contribute to average

            sums[position] += enveloped[position];
            frames[position]++;

        }

    }

    play(){

        /*
        
            Starts playing the track of the piece.

            [Input]
                None

            [Output]
                None

        */

        this.audio.play();
        this.audio.target_volume = 0.3; // Set volume to 0.3 (30% volume)

    }

    pause(){

        /*
        
            Starts playing the track of the piece.

            [Input]
                None

            [Output]
                None

        */

        this.audio.target_volume = 0; // Set volume to 0 (Stops playing with the setInterval at line 37)

    }

    is_on_beat(position, THRESHOLD = 3, overwrite = true){

        /*
        
            Checks whether or not the current moment is on beat.

            [Input]
                position  => Which range of frequency needs to be checked.
                THRESHOLD => Sensitivity of a peak
                overwrite => A boolean to indicate if the running sum should be reset

            [Output]
                boolean   => Whether or not the current moment is on beat. 

        */

        // Prevent indexing out of bounds

        position = Math.min(position, this._buffer);

        // Grab the correct frequency branch (low, mid, high)

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

        // Get average (minus a little bit of decay to make it more sensitive)

        let avg = sums[position] / frames[position] - DECAY * frames[position];

        // Check if there has been an increase in level/volume, and that there has been at least a decent amount of frames in between current and past beat

        if(frames[position] > 5 && data[position] - avg > THRESHOLD) {

            // Overwrite past levels data (compress it down to one single frame in the case of shifting music theme/sections and removes the influence)

            sums[position] /= frames[position];
            frames[position] = 1;

            return true;

        }

        return false;
    
    }

}

class SFXManager {

    /*

        A class to manage and play in-game sound effects

    */

    constructor(link, volume){

        /*
        
            Initializes the sound effects manager.

            [Input]
                link      => Location of sound effect as a string.
                volume    => Loudness of the sound effect as a float.

            [Output]
                None

        */

        // Loads the sound effect (So we don't have to load it every single time to play it)

        this.audio = new Audio();
        this.audio.src = link;
        this.audio.autoplay = true;
        this.audio.controls = true;
        this.audio.crossOrigin = "anonymous";
        this.audio.volume = volume;

        this._context = new AudioContext();
        this._source = this._context.createMediaElementSource(this.audio);

        this._source.connect(this._context.destination); // Connecting straight to destination (No need for filters and all the fancy things)
        this.audio.pause();

        // Clone audio if we want to play the same thing multiple times at once (This is not supported with one, we need multiple)

        this.cloned_audio = this.audio.cloneNode();
        this.cloned_audio.volume = volume;
        this.cloned_audio.pause();

    }

    play() {

        /*
        
            Starts playing the track of a sound effect.

            [Input]
                None

            [Output]
                None

        */

        if(this.audio.paused == true) // If main one isn't playing, play it
            this.audio.play();
        else                          // Otherwise play the cloned one instead (No audible difference) 
            this.cloned_audio.play();
    }

}

// Links for the mp3 files

const PLAYLIST = [
    "https://cycnus-studio.github.io/Project/audio/QuestionMark.mp3",
    "https://cycnus-studio.github.io/Project/audio/HideAndSeek.mp3",
    "https://cycnus-studio.github.io/Project/audio/InTheTigersDen.mp3"];

class PlaylistManager {

    /*

        A class/wrapper of the main Audio Processor to play and work with multiple songs.

    */

    constructor(){

        /*
        
            Initializes the playlist of multiple songs.

            [Input]
                None

            [Output]
                None

        */

        this._current;    // Current piece
        this._music = []; // Array of pieces.

        // Load every piece now so we don't have to reload it later.

        for(let link of PLAYLIST){

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

        // Pick an arbitrary piece to play

        this._current = this._music[rand_range(0, this._music.length - 1)];

        // Periodically check if piece is done playing

        setInterval(function is_music_finished(playlist){

            // This is where the boolean is useful (See line 60)

            if(playlist._current.is_over == true){

                playlist._current.pause();

                // Play another arbitrary piece

                playlist.set_music(rand_range(0, playlist._music.length - 1));

            }

        }, 500, this);


    }

    set_music(position) {

        /*
        
            Sets a piece to play.

            [Input]
                position => An integer representing the piece to play from the _music array.

            [Output]
                None

        */

        this._current = this._music[position];
        this._current.is_over = false;         // Reset this to not done playing
        this._current.play();                  // Play!

    }

    update() {

        /*
        
            Updates the data for the audio processor.

            [Input]
                None

            [Output]
                None

        */

        this._current.update();

    }

    play() {

        /*
        
            Presses play for the audio piece.

            [Input]
                None

            [Output]
                None

        */

        this._current.play();

    }

    pause() {

        /*
        
            Stops the piece.

            [Input]
                None

            [Output]
                None

        */

        this._current.pause();

    }

    is_on_beat(position, THRESHOLD = 3, overwrite = true) {

        /*
        
            Checks if a piece is on beat (Although it is just a wrapper to the AudioProcessor)

            [Input]
                position  => Which range of frequency needs to be checked.
                THRESHOLD => Sensitivity of a peak
                overwrite => A boolean to indicate if the running sum should be reset

            [Output]
                boolean   => Whether or not the current moment is on beat. 

        */

        return this._current.is_on_beat(position, THRESHOLD, overwrite);

    }

}
