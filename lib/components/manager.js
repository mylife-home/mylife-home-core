'use strict';

module.exports = class Manager {
  constructor() {

  }

  list() {
/*
struct binding
{
  std::string remote_id;
  std::string remote_attribute;
  std::string local_action;
};

struct component
{
  std::string library;
  std::string type;
  std::string id;
  std::vector<binding> bindings;
  std::map<std::string, std::string> config;
  std::map<std::string, std::string> designer;
};
*/
  }

  create(data) {
    console.log(data);
/*
    std::string comp_id;
    std::string library;
    std::string type;
    std::map<std::string, std::string> config;
    std::map<std::string, std::string> designer;
*/
  }

  setDesigner(data) {
    console.log(data);
/*
    std::string comp_id;
    std::map<std::string, std::string> designer;
*/
  }

  delete(data) {
    console.log(data);
/*
    std::string comp_id;
*/
  }

  bind(data) {
    console.log(data);
/*
    std::string local_id;
    std::string local_action;
    std::string remote_id;
    std::string remote_attribute;
*/
  }

  unbind(data) {
    console.log(data);
/*
    std::string local_id;
    std::string local_action;
    std::string remote_id;
    std::string remote_attribute;
*/
  }
};
