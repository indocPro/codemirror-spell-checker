"use strict";

var Typo = require("typo-js");

function CodeMirrorSpellChecker(options) {
	options = options || {};

	var dictLang = "en_US";

	if(options.dictionaryLanguage) {
		dictLang = options.dictionaryLanguage;
	}

	if(typeof options.editorInstance !== "function" || typeof options.editorInstance.defineMode !== "function") {
		console.log("CodeMirror Spell Checker: You must provide an instance of CodeMirror via the option `editorInstance`");
		return;
	}

	if(options.typo === undefined) {
		options.typo = new Typo(dictLang, undefined, undefined, {
			platform: "any",
			dictionaryPath: "https://spellcheck-dictionaries.github.io/",
		});
	}

	options.editorInstance.defineMode("spell-checker", function(config) {
		var wordRegex = /^[^!"#$%&()*+,\-./:;<=>?@[\\\]^_`{|}~\s]+/;

		if(options.matchRegex && options.matchRegex instanceof RegExp) {
			wordRegex = options.matchRegex;
		}

		var regexIgnore = /[0-9'_-]+/;

		if(options.ignoreRegex && options.ignoreRegex instanceof RegExp) {
			regexIgnore = options.ignoreRegex;
		}

		var customWords = [];

		if(options.customWords) {
			if(options.customWords instanceof Function) {
				customWords = options.customWords();
			} else {
				customWords = options.customWords;
			}
		}

		var commentRegex;

		if(options.commentStart) {
			commentRegex = new RegExp("\\s*" + options.commentStart);
		}

		var overlay = {
			token: function(stream) {
				// Ignore comments if configured, and exit early
				if(commentRegex && stream.string.match(commentRegex)) {
					stream.next();
					return null;
				}

				var word = stream.match(wordRegex, true);

				if(word) {
					word = word[0];

					if(
						!word.match(regexIgnore) &&
						options.typo &&
						!options.typo.check(word) &&
						!~customWords.indexOf(word)
					) {
						return "spell-error";
					}
				} else {
					stream.next();
					return null;
				}
			},
		};

		var mode = options.editorInstance.getMode(
			config, config.backdrop || "text/plain"
		);

		return options.editorInstance.overlayMode(mode, overlay, true);
	});
}

module.exports = CodeMirrorSpellChecker;