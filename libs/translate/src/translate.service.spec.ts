import { TestBed, inject } from '@angular/core/testing';

import { TranslateService } from './translate.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

describe('TranslateService', () => {

  let translate: TranslateService;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [TranslateService]
    });

    translate = TestBed.get(TranslateService);
    http = TestBed.get(HttpClient);
  });

  it('should be created', inject([TranslateService], (service: TranslateService) => {
    expect(service).toBeTruthy();
  }));

  it('should fetch and return translation data on use', async () => {
    const translation = { title: 'hello' };
    spyOn(http, 'get').and.returnValue(Observable.of(translation));

    const fetched = await translate.use('en');
    expect(fetched).toEqual(translation);
  });

  it('should return empty data on fetch error', async () => {
    spyOn(http, 'get').and.returnValue(Observable.throw('error'));

    const fetched = await translate.use('en');
    expect(fetched).toEqual({});
  });

  it('should return existing data on fetch error', async () => {
    spyOn(http, 'get').and.returnValue(Observable.throw('error'));

    const data = { title: 'hello' };
    await translate.use('en', data);

    const result = await translate.use('en');
    expect(result).toEqual(data);
  });

  it('should fetch the language file from the correct folder', async () => {
    spyOn(http, 'get').and.returnValue(Observable.of({}));

    await translate.use('en');
    expect(http.get).toHaveBeenCalledWith('assets/i18n/en.json');
  });

  it('should fetch fallback language', async () => {
    spyOn(http, 'get').and.returnValue(Observable.of({}));

    await translate.use(null);
    expect(http.get).toHaveBeenCalledWith(`assets/i18n/${translate.fallbackLang}.json`);
  });

  it('should use custom data for a lang', async () => {
    const custom = { title: 'custom title' };
    spyOn(http, 'get').and.returnValue(Observable.of({}));

    const result = await translate.use('en', custom);

    expect(result).toEqual(custom);
    expect(http.get).not.toHaveBeenCalled();
    expect(translate.get('title', null, 'en')).toBe(custom.title);
  });

  it('should setup empty translation for missing data', async () => {
    spyOn(http, 'get').and.returnValue(Observable.of(null));
    const result = await translate.use('fr');
    expect(result).toEqual({});
  });

  it('should return existing data when fetching a lang', async () => {
    const custom = { title: 'custom title' };
    spyOn(http, 'get').and.returnValue(Observable.of({}));

    await translate.use('en', custom);
    const result = await translate.use('en');

    expect(result).toEqual(custom);
    expect(http.get).not.toHaveBeenCalled();
  });

  it('should have fallback lang defined by default', () => {
    expect(translate.fallbackLang).toEqual('en');
  });

  it('should switch fallback lang value', () => {
    translate.fallbackLang = 'fr';
    expect(translate.fallbackLang).toEqual('fr');

    translate.fallbackLang = 'ua';
    expect(translate.fallbackLang).toEqual('ua');
  });

  it('should use [en] when setting wrong fallback language', () => {
    translate.fallbackLang = null;
    expect(translate.fallbackLang).toEqual('en');

    translate.fallbackLang = '';
    expect(translate.fallbackLang).toEqual('en');

    translate.fallbackLang = undefined;
    expect(translate.fallbackLang).toEqual('en');
  });

  it('should have active lang defined by default', () => {
    expect(translate.activeLang).toEqual('en');
  });

  it('should use fallback lang when setting wrong active lang', () => {
    translate.activeLang = null;
    expect(translate.activeLang).toEqual(translate.fallbackLang);

    translate.activeLang = '';
    expect(translate.activeLang).toEqual(translate.fallbackLang);

    translate.activeLang = undefined;
    expect(translate.activeLang).toEqual(translate.fallbackLang);
  });

  it('should switch active lang value', () => {
    translate.activeLang = 'fr';
    expect(translate.activeLang).toEqual('fr');

    translate.activeLang = 'ua';
    expect(translate.activeLang).toEqual('ua');
  });

  it('should have active lang set to fallback one by default', () => {
    expect(translate.activeLang).toBeDefined();
    expect(translate.activeLang).toEqual(translate.fallbackLang);
  });

  it('should get active lang translation', async () => {
    const data = { title: 'hello' };
    await translate.use('en', data);

    expect(translate.get('title')).toEqual('hello');
  });

  it('should get translation for the given language', async () => {
    const data_en = { title: 'hello' };
    const data_fr = { title: 'bonjour' };
    await translate.use('en', data_en);
    await translate.use('fr', data_fr);

    expect(translate.get('title', null, 'fr')).toEqual(data_fr.title);
  });

  it('should return key for missing translation', () => {
    expect(translate.get('KEY')).toBe('KEY');
  });

  it('should merge simple translations', async () => {
    const version1 = { 'key1': 'value1' };
    const version2 = { 'key2': 'value2' };
    const version3 = { 'key3': 'value3' };

    await translate.use('en', version1);
    await translate.use('en', version2);
    const result = await translate.use('en', version3);

    expect(result).toEqual({
      'key1': 'value1',
      'key2': 'value2',
      'key3': 'value3'
    });
  });

  it('should merge complex translations', async () => {
    const version1 = { 'key1': 'value1' };
    const version2 = { 'key2': { 'child1_key': 'child1_value' } };
    const version3 = { 'key3': { 'child2': { 'sub1': 'sub2' } } };

    await translate.use('en', version1);
    await translate.use('en', version2);
    const result = await translate.use('en', version3);

    expect(result).toEqual({
      'key1': 'value1',
      'key2': {
        'child1_key': 'child1_value'
      },
      'key3': {
        'child2': {
          'sub1': 'sub2'
        }
      }
    });
  });

  it('should merge arrays', async () => {
    const version1 = { 'key1': [ 'one', 'two' ] };
    const version2 = { 'key1': [ 'three', 'four' ] };

    await translate.use('en', version1);
    const result = await translate.use('en', version2);

    expect(result).toEqual({
      'key1': [ 'one', 'two', 'three', 'four' ]
    });
  });

  it('should merge objects', async () => {
    const version1 = { 'key1': { 'value1': 'one' } };
    const version2 = { 'key1': { 'value2': 'two' } };

    await translate.use('en', version1);
    const result = await translate.use('en', version2);

    expect(result).toEqual({
      'key1': {
        'value1': 'one',
        'value2': 'two'
      }
    })
  });

  it('should overwrite top-level properties', async () => {
    const version1 = { 'key1': 'value1' };
    const version2 = { 'key1': 'value2' };

    await translate.use('en', version1);
    const result = await translate.use('en', version2);

    expect(result).toEqual({
      'key1': 'value2'
    });
  });

  it('should translate by property path', async () => {
    const data = {
      'MAIN': {
        'APPLICATION': {
          'TITLE': 'Hello there!'
        }
      }
    };

    await translate.use('en', data);
    const result = translate.get('MAIN.APPLICATION.TITLE');

    expect(result).toBe('Hello there!');
  });

  it('should return key when sub-property missing', async () => {
    const data = {
      'MAIN': {
        'APPLICATION': {}
      }
    };

    await translate.use('en', data);
    const result = translate.get('MAIN.APPLICATION.TITLE');

    expect(result).toBe('MAIN.APPLICATION.TITLE');
  });

  it('should return key for missing property path', () => {
    const key = 'MAIN.APPLICATION.TITLE';
    expect(translate.get(key)).toEqual(key);
  });

  it('should return null if translating with a missing key', () => {
    expect(translate.get('')).toBeNull();
    expect(translate.get(null)).toBeNull();
    expect(translate.get(undefined)).toBeNull();
  });

  it('should return translate key for separator', () => {
    expect(translate.get('.')).toEqual('.');
  });

  it('should translate when key is a property path', async () => {
    const data = {
      'MAIN.APPLICATION.TITLE': 'Hello there!'
    };

    await translate.use('en', data);
    expect(translate.get('MAIN.APPLICATION.TITLE')).toEqual('Hello there!');
  });

  it('should use translate using format params', async () => {
    const data = {
      'MESSAGE_FORMAT': 'Hello, {username}!'
    };

    await translate.use('en', data);
    const result = translate.get('MESSAGE_FORMAT', { 'username': 'Denys' });

    expect(result).toEqual('Hello, Denys!');
  });

  it('should use multiple format params', async () => {
    const data = {
      'MESSAGE_FORMAT': '{message}, {username}!'
    };

    await translate.use('en', data);
    const result = translate.get('MESSAGE_FORMAT', { 'message': 'Hello', 'username': 'Denys' });

    expect(result).toEqual('Hello, Denys!');
  });

  it('should use original string when format params not provided', async () => {
    const data = {
      'MESSAGE_FORMAT': 'Hello, {username}!'
    };

    await translate.use('en', data);
    const result = translate.get('MESSAGE_FORMAT', null);

    expect(result).toEqual(data.MESSAGE_FORMAT);
  });

  it('should use original string when format params are empty', async () => {
    const data = {
      'MESSAGE_FORMAT': 'Hello, {username}!'
    };

    await translate.use('en', data);
    const result = translate.get('MESSAGE_FORMAT', {});

    expect(result).toEqual(data.MESSAGE_FORMAT);
  });

  it('should use fallback language for missing translation', async () => {
    const en = { MESSAGE: 'hello' };
    const fr = { };

    await translate.use('en', en);
    await translate.use('fr', fr);

    const result = translate.get('MESSAGE', null, 'fr');
    expect(result).toEqual(en.MESSAGE);
  });

  it('should use format params with fallback value', async () => {
    const en = { MESSAGE: 'hello, {username}' };
    const fr = { };

    await translate.use('en', en);
    await translate.use('fr', fr);

    translate.activeLang = 'fr';

    const result = translate.get('MESSAGE', { username: 'admin' });
    expect(result).toEqual('hello, admin');
  });

  it('should return the key if active and fallback translations missing', async () => {
    const en = { };
    const fr = { };

    await translate.use('en', en);
    await translate.use('fr', fr);

    const result = translate.get('MESSAGE', null, 'fr');
    expect(result).toEqual('MESSAGE');
  });

  it('should not change active language when setting lang data', async () => {
    translate.activeLang = 'it';

    const data = { MESSAGE: 'bonjour' };
    await translate.use('fr', data);

    expect(translate.activeLang).toBe('it');
  });

  it('should not change fallback language when setting lang data', async () => {
    translate.fallbackLang = 'it';

    const data = { MESSAGE: 'bonjour' };
    await translate.use('fr', data);

    expect(translate.fallbackLang).toBe('it');
  });

  it('should update url if cache is disabled', async () => {
    translate.disableCache = true;

    let requested = '';

    spyOn(http, 'get').and.callFake((url: string) => {
      requested = url;
      return Observable.of({});
    });

    await translate.use('en');

    const match = requested.match(/(\?v=\d+)/g);
    expect(match).toBeDefined();
    expect(match.length).toBe(1);
  });
});
